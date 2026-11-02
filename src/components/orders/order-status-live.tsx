"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/ui/locale-provider";
import { getPublicCopy } from "@/i18n/public";
import type { OrderStatus } from "@/types/orders";
import { markPublicOrderDelivered } from "@/lib/orders/actions";

export type PublicOrderStatus = {
  order_number: string;
  order_type: string;
  status: OrderStatus;
  payment_method: string;
  payment_status: string;
  created_at: string;
  dining_tables?: Array<{ table_number: string }> | null;
};

type PublicOrderNotification = {
  id: string;
  kind: "order_created" | "order_status_changed";
  payload: { orderNumber?: string; status?: OrderStatus };
  createdAt: string;
};

const statusSteps: OrderStatus[] = ["new", "confirmed", "preparing", "ready", "delivered"];

export function OrderStatusLive({
  orderNumber,
  token,
  initialOrder,
}: {
  orderNumber: string;
  token: string;
  initialOrder: PublicOrderStatus;
}) {
  const { locale } = useLocale();
  const t = getPublicCopy(locale);
  const [order, setOrder] = useState(initialOrder);
  const [confirmingDelivery, setConfirmingDelivery] = useState(false);
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [notifications, setNotifications] = useState<PublicOrderNotification[]>([]);

  useEffect(() => {
    let active = true;
    let refreshing = false;
    const refresh = async () => {
      if (refreshing || document.visibilityState === "hidden") return;
      refreshing = true;
      try {
        const [statusResponse, notificationsResponse] = await Promise.all([
          fetch(
            `/api/order-status/${encodeURIComponent(orderNumber)}?token=${encodeURIComponent(token)}`,
            { cache: "no-store" },
          ),
          fetch(
            `/api/order-notifications/${encodeURIComponent(orderNumber)}?token=${encodeURIComponent(token)}`,
            { cache: "no-store" },
          ),
        ]);
        if (statusResponse.ok && active)
          setOrder((await statusResponse.json()) as PublicOrderStatus);
        if (notificationsResponse.ok && active)
          setNotifications((await notificationsResponse.json()) as PublicOrderNotification[]);
      } catch {
        // Keep showing the last known order status if a refresh temporarily fails.
      } finally {
        refreshing = false;
      }
    };
    const interval = window.setInterval(refresh, 5000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [orderNumber, token]);

  const currentStep = statusSteps.indexOf(order.status);
  const statusLabel = (
    {
      new: t.pendingReview,
      confirmed: t.confirmed,
      preparing: t.preparing,
      ready: t.ready,
      delivered: t.delivered,
      cancelled: t.cancelled,
      rejected: t.rejected,
    } as Record<OrderStatus, string>
  )[order.status];

  return (
    <>
      <h1 className="text-3xl font-semibold">
        {t.order} {order.order_number}
      </h1>
      <div className="mt-6 rounded-xl bg-[var(--color-background-deep)] p-4">
        <p className="text-sm text-[var(--color-text-muted)]">{t.pendingReview}</p>
        <p className="mt-1 text-2xl font-bold">{statusLabel}</p>
        <p className="mt-3 text-sm text-[var(--color-text-muted)]">
          {t.payment}: {order.payment_method === "cash" ? t.paymentCash : order.payment_status} ·{" "}
          {order.order_type === "table"
            ? `${t.order} ${order.dining_tables?.[0]?.table_number ?? ""}`
            : t.deliveryOrder}
        </p>
      </div>
      {notifications.length ? (
        <section
          className="mt-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          aria-label={t.notifications}
        >
          <h2 className="font-semibold">{t.notifications}</h2>
          <div className="mt-3 grid gap-2">
            {notifications.slice(0, 5).map((notification) => {
              const notificationStatus = notification.payload.status;
              const notificationStatusLabel = notificationStatus
                ? (
                    {
                      new: t.pendingReview,
                      confirmed: t.confirmed,
                      preparing: t.preparing,
                      ready: t.ready,
                      delivered: t.delivered,
                      cancelled: t.cancelled,
                      rejected: t.rejected,
                    } as Record<OrderStatus, string>
                  )[notificationStatus]
                : "";
              return (
                <div
                  className="rounded-lg border border-[var(--color-border)] p-3 text-sm"
                  key={notification.id}
                >
                  <p className="font-medium">
                    {notification.kind === "order_created"
                      ? t.newOrderNotification
                      : t.orderStatusNotification}
                  </p>
                  {notificationStatusLabel ? (
                    <p className="mt-1 text-[var(--color-text-muted)]">{notificationStatusLabel}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    {new Date(notification.createdAt).toLocaleString(
                      locale === "ar" ? "ar-EG" : locale,
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
      <ol className="mt-7 grid gap-3 text-sm">
        {statusSteps.map((step, index) => {
          const reached = currentStep >= index;
          const label = (
            {
              new: t.received,
              confirmed: t.confirmed,
              preparing: t.preparing,
              ready: t.ready,
              delivered: t.delivered,
            } as Record<string, string>
          )[step];
          return (
            <li
              className={`rounded-xl border p-3 ${reached ? "border-[var(--color-success)] bg-[rgba(94,118,93,0.08)]" : "border-[var(--color-border)]"}`}
              key={step}
            >
              {reached ? "✓ " : ""}
              {label}
            </li>
          );
        })}
        {order.status === "ready" ? (
          <li className="grid gap-3 rounded-xl border border-[var(--color-brand-primary)] bg-[rgba(94,118,93,0.08)] p-3">
            <span>{t.contactCourier}</span>
            <button
              type="button"
              disabled={confirmingDelivery}
              onClick={async () => {
                setConfirmingDelivery(true);
                setDeliveryMessage("");
                const result = await markPublicOrderDelivered(orderNumber, token);
                if (result.success) {
                  setOrder((current) => ({ ...current, status: "delivered" }));
                  setDeliveryMessage(t.deliveryConfirmed);
                } else {
                  setDeliveryMessage(t.deliveryConfirmError);
                }
                setConfirmingDelivery(false);
              }}
              className="min-h-10 rounded-[var(--radius-pill)] bg-[var(--color-brand-secondary)] px-4 text-sm font-semibold text-[var(--color-on-brand)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {confirmingDelivery ? t.submitting : t.confirmDelivery}
            </button>
            {deliveryMessage ? <span role="status">{deliveryMessage}</span> : null}
          </li>
        ) : order.status === "cancelled" || order.status === "rejected" ? (
          <li className="rounded-xl border border-[var(--color-danger)] p-3 text-[var(--color-danger)]">
            {statusLabel}
          </li>
        ) : order.status !== "delivered" ? (
          <li className="rounded-xl border border-[var(--color-border)] p-3">{t.contactCourier}</li>
        ) : null}
      </ol>
    </>
  );
}
