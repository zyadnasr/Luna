"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient as createBrowserClient } from "@/lib/supabase/browser";
import { useLocale } from "@/components/ui/locale-provider";
import { getTranslations } from "@/i18n";
import type { StoredNotification } from "@/lib/notifications/server";

const labels = {
  ar: {
    title: "الإشعارات",
    empty: "لا توجد إشعارات جديدة.",
    newOrder: "طلب جديد",
    status: "تحديث حالة الطلب",
    markAll: "تحديد الكل كمقروء",
    close: "إغلاق الإشعارات",
    incoming: "تنبيه جديد",
    enableDesktop: "تفعيل إشعارات الجهاز",
  },
  en: {
    title: "Notifications",
    empty: "No new notifications.",
    newOrder: "New order",
    status: "Order status updated",
    markAll: "Mark all as read",
    close: "Close notifications",
    incoming: "New alert",
    enableDesktop: "Enable desktop notifications",
  },
  it: {
    title: "Notifiche",
    empty: "Nessuna nuova notifica.",
    newOrder: "Nuovo ordine",
    status: "Stato ordine aggiornato",
    markAll: "Segna tutto come letto",
    close: "Chiudi notifiche",
    incoming: "Nuovo avviso",
    enableDesktop: "Attiva notifiche desktop",
  },
} as const;

function notificationText(notification: StoredNotification, locale: "ar" | "en" | "it") {
  const t = getTranslations(locale);
  const orderNumber = notification.payload.orderNumber ?? "";
  const status = notification.payload.status;
  const statusLabel = status ? (t.orders.status[status] ?? status) : "";
  return notification.kind === "order_created"
    ? `${labels[locale].newOrder} ${orderNumber}`
    : `${labels[locale].status}: ${orderNumber} · ${statusLabel}`;
}

export function AdminNotifications({
  initialNotifications,
}: {
  initialNotifications: StoredNotification[];
}) {
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [incoming, setIncoming] = useState<StoredNotification | null>(null);
  const [desktopPermission, setDesktopPermission] = useState<
    NotificationPermission | "unsupported"
  >("default");
  const knownIds = useRef(new Set(initialNotifications.map((notification) => notification.id)));
  const audioContext = useRef<AudioContext | null>(null);
  const desktopPermissionRef = useRef<NotificationPermission | "unsupported">("default");
  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const requestDesktopPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      desktopPermissionRef.current = "unsupported";
      setDesktopPermission("unsupported");
      return;
    }
    if (window.Notification.permission !== "default") {
      desktopPermissionRef.current = window.Notification.permission;
      setDesktopPermission(window.Notification.permission);
      return;
    }
    const permission = await window.Notification.requestPermission();
    desktopPermissionRef.current = permission;
    setDesktopPermission(permission);
  }, []);

  const showDesktopNotification = useCallback(
    (notification: StoredNotification) => {
      if (desktopPermissionRef.current !== "granted") return;
      try {
        new window.Notification(labels[locale].incoming, {
          body: notificationText(notification, locale),
          tag: notification.id,
        });
      } catch {
        // The in-app alert and sound remain available if desktop notifications fail.
      }
    },
    [locale],
  );

  const playNotificationSound = useCallback(() => {
    try {
      const AudioContextConstructor = window.AudioContext;
      if (!AudioContextConstructor) return;
      const context = audioContext.current ?? new AudioContextConstructor();
      audioContext.current = context;
      const start = () => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(880, context.currentTime);
        oscillator.frequency.setValueAtTime(1175, context.currentTime + 0.12);
        gain.gain.setValueAtTime(0.0001, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.16, context.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.34);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.36);
      };
      if (context.state === "suspended") void context.resume().then(start);
      else start();
    } catch {
      // Browsers can block audio until the admin interacts with the page.
    }
  }, []);

  const announce = useCallback(
    (notification: StoredNotification) => {
      if (knownIds.current.has(notification.id)) return;
      knownIds.current.add(notification.id);
      setNotifications((current) =>
        [notification, ...current.filter((item) => item.id !== notification.id)].slice(0, 30),
      );
      setIncoming(notification);
      playNotificationSound();
      showDesktopNotification(notification);
      window.setTimeout(
        () => setIncoming((current) => (current?.id === notification.id ? null : current)),
        7000,
      );
    },
    [playNotificationSound, showDesktopNotification],
  );

  const mergeFetchedNotifications = useCallback(
    (next: StoredNotification[]) => {
      const unseen = next.filter((notification) => !knownIds.current.has(notification.id));
      setNotifications(next);
      if (unseen.length) {
        announce(unseen[0]);
        unseen.slice(1).forEach((notification) => knownIds.current.add(notification.id));
      }
    },
    [announce],
  );

  useEffect(() => {
    const supabase = createBrowserClient();
    const channel = supabase
      .channel("admin-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: "audience=eq.admin" },
        (event) => {
          const next = event.new as {
            id: string;
            kind: StoredNotification["kind"];
            payload: StoredNotification["payload"];
            created_at: string;
          };
          announce({
            id: next.id,
            kind: next.kind,
            payload: next.payload,
            createdAt: next.created_at,
            read: false,
          });
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn(`Admin notification realtime status: ${status}`);
        }
      });
    const poll = window.setInterval(async () => {
      if (document.visibilityState === "hidden") return;
      try {
        const response = await fetch("/api/admin/notifications", { cache: "no-store" });
        if (response.ok) mergeFetchedNotifications((await response.json()) as StoredNotification[]);
      } catch {
        // Realtime remains active if the fallback request temporarily fails.
      }
    }, 5000);
    return () => {
      void supabase.removeChannel(channel);
      window.clearInterval(poll);
    };
  }, [announce, mergeFetchedNotifications]);

  async function markAsRead(id: string) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    );
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: id }),
    });
  }

  async function markAllAsRead() {
    const unread = notifications.filter((notification) => !notification.read);
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
    await Promise.all(
      unread.map((notification) =>
        fetch("/api/notifications/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId: notification.id }),
        }),
      ),
    );
  }

  return (
    <>
      {incoming ? (
        <button
          type="button"
          role="alert"
          onClick={() => {
            setOpen(true);
            void markAsRead(incoming.id);
            setIncoming(null);
          }}
          className="fixed inset-x-3 top-20 z-[60] grid gap-1 rounded-[var(--radius-lg)] border border-[var(--color-brand-primary)] bg-[var(--color-surface-elevated)] p-3 text-start shadow-[var(--shadow-soft)] sm:inset-x-auto sm:end-6 sm:top-24 sm:w-[min(24rem,calc(100vw-3rem))] sm:p-4"
        >
          <span className="text-xs font-semibold text-[var(--color-brand-primary)]">
            {labels[locale].incoming}
          </span>
          <span className="font-semibold">{notificationText(incoming, locale)}</span>
          <span className="text-xs text-[var(--color-text-muted)]">
            {new Date(incoming.createdAt).toLocaleString(locale === "ar" ? "ar-EG" : locale)}
          </span>
        </button>
      ) : null}
      <div className="relative">
        <button
          type="button"
          aria-expanded={open}
          aria-label={labels[locale].title}
          onClick={() => {
            void requestDesktopPermission();
            setOpen((current) => !current);
          }}
          className="relative max-w-[9.5rem] truncate rounded-[var(--radius-pill)] border border-[var(--color-border)] px-2.5 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] transition hover:border-[var(--color-brand-primary)] sm:max-w-none sm:px-4 sm:py-2 sm:text-sm"
        >
          {labels[locale].title}
          {unreadCount ? (
            <span className="ms-2 inline-grid min-w-5 place-items-center rounded-full bg-[var(--color-danger)] px-1.5 py-0.5 text-[0.68rem] text-white">
              {unreadCount}
            </span>
          ) : null}
        </button>
        {open ? (
          <div className="fixed inset-x-3 top-20 z-50 max-h-[calc(100dvh-6rem)] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-3 shadow-[var(--shadow-soft)] sm:absolute sm:inset-x-auto sm:end-0 sm:top-12 sm:max-h-none sm:w-[min(22rem,calc(100vw-2rem))]">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] px-2 pb-3">
              <p className="font-semibold">{labels[locale].title}</p>
              <div className="flex items-center gap-2">
                {unreadCount ? (
                  <button
                    type="button"
                    className="text-xs text-[var(--color-brand-primary)]"
                    onClick={markAllAsRead}
                  >
                    {labels[locale].markAll}
                  </button>
                ) : null}
                <button
                  type="button"
                  aria-label={labels[locale].close}
                  onClick={() => setOpen(false)}
                >
                  ×
                </button>
              </div>
            </div>
            {desktopPermission === "default" ? (
              <button
                type="button"
                className="mt-2 w-full rounded-[var(--radius-sm)] border border-[var(--color-brand-primary)] px-3 py-2 text-xs font-semibold text-[var(--color-brand-primary)]"
                onClick={() => void requestDesktopPermission()}
              >
                {labels[locale].enableDesktop}
              </button>
            ) : null}
            <div className="mt-2 grid max-h-[min(20rem,calc(100dvh-10rem))] gap-1 overflow-y-auto">
              {notifications.length ? (
                notifications.map((notification) => (
                  <button
                    type="button"
                    key={notification.id}
                    className={`grid gap-1 rounded-[var(--radius-sm)] p-3 text-start text-sm transition hover:bg-[var(--color-nav-active-bg)] ${notification.read ? "opacity-70" : "bg-[var(--color-nav-active-bg)]"}`}
                    onClick={() => void markAsRead(notification.id)}
                  >
                    <span className="font-semibold">{notificationText(notification, locale)}</span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {new Date(notification.createdAt).toLocaleString(
                        locale === "ar" ? "ar-EG" : locale,
                      )}
                    </span>
                  </button>
                ))
              ) : (
                <p className="p-3 text-sm text-[var(--color-text-muted)]">{labels[locale].empty}</p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
