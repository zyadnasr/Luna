"use client";

import { useEffect, useMemo, useState } from "react";
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
  },
  en: {
    title: "Notifications",
    empty: "No new notifications.",
    newOrder: "New order",
    status: "Order status updated",
    markAll: "Mark all as read",
    close: "Close notifications",
  },
  it: {
    title: "Notifiche",
    empty: "Nessuna nuova notifica.",
    newOrder: "Nuovo ordine",
    status: "Stato ordine aggiornato",
    markAll: "Segna tutto come letto",
    close: "Chiudi notifiche",
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
  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
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
          setNotifications((current) =>
            [
              {
                id: next.id,
                kind: next.kind,
                payload: next.payload,
                createdAt: next.created_at,
                read: false,
              },
              ...current.filter((notification) => notification.id !== next.id),
            ].slice(0, 30),
          );
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

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
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label={labels[locale].title}
        onClick={() => setOpen((current) => !current)}
        className="relative rounded-[var(--radius-pill)] border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:border-[var(--color-brand-primary)]"
      >
        {labels[locale].title}
        {unreadCount ? (
          <span className="ms-2 inline-grid min-w-5 place-items-center rounded-full bg-[var(--color-danger)] px-1.5 py-0.5 text-[0.68rem] text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute end-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-3 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-2 pb-3">
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
          <div className="mt-2 grid max-h-80 gap-1 overflow-y-auto">
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
  );
}
