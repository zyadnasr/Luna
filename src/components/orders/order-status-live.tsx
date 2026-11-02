"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/ui/locale-provider";
import { getPublicCopy } from "@/i18n/public";
import type { OrderStatus } from "@/types/orders";

export type PublicOrderStatus = {
  order_number: string;
  order_type: string;
  status: OrderStatus;
  payment_method: string;
  payment_status: string;
  created_at: string;
  dining_tables?: Array<{ table_number: string }> | null;
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

  useEffect(() => {
    let active = true;
    let refreshing = false;
    const refresh = async () => {
      if (refreshing || document.visibilityState === "hidden") return;
      refreshing = true;
      try {
        const response = await fetch(
          `/api/order-status/${encodeURIComponent(orderNumber)}?token=${encodeURIComponent(token)}`,
          { cache: "no-store" },
        );
        if (response.ok && active) setOrder((await response.json()) as PublicOrderStatus);
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
        {order.status === "cancelled" || order.status === "rejected" ? (
          <li className="rounded-xl border border-[var(--color-danger)] p-3 text-[var(--color-danger)]">
            {statusLabel}
          </li>
        ) : (
          <li className="rounded-xl border border-[var(--color-border)] p-3">{t.contactCourier}</li>
        )}
      </ol>
    </>
  );
}
