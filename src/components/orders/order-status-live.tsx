"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/components/ui/locale-provider";
import { getPublicCopy } from "@/i18n/public";
import type { OrderStatus } from "@/types/orders";
import { cancelPublicOrder, markPublicOrderDelivered } from "@/lib/orders/actions";

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

function formatDate(value: string, locale: string) {
  return new Date(value).toLocaleString(locale === "ar" ? "ar-EG" : locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusTone(status: OrderStatus) {
  if (status === "delivered") return "var(--color-success)";
  if (status === "cancelled" || status === "rejected") return "var(--color-danger)";
  if (status === "new") return "var(--color-warning)";
  return "var(--color-brand-primary)";
}

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
  const [confirmingCancellation, setConfirmingCancellation] = useState(false);
  const [showCancellationPrompt, setShowCancellationPrompt] = useState(false);

  useEffect(() => {
    let active = true;
    let refreshing = false;
    const refresh = async () => {
      if (refreshing || document.visibilityState === "hidden") return;
      refreshing = true;
      try {
        const statusResponse = await fetch(
          `/api/order-status/${encodeURIComponent(orderNumber)}?token=${encodeURIComponent(token)}`,
          { cache: "no-store" },
        );
        if (statusResponse.ok && active) {
          setOrder((await statusResponse.json()) as PublicOrderStatus);
        }
      } catch {
        // Keep showing the last known state if a refresh temporarily fails.
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

  const statusLabels = {
    new: t.pendingReview,
    confirmed: t.confirmed,
    preparing: t.preparing,
    ready: t.ready,
    delivered: t.delivered,
    cancelled: t.cancelled,
    rejected: t.rejected,
  } as Record<OrderStatus, string>;
  const stepLabels = {
    new: t.received,
    confirmed: t.confirmed,
    preparing: t.preparing,
    ready: t.ready,
    delivered: t.delivered,
  } as Record<(typeof statusSteps)[number], string>;
  const currentStep = statusSteps.indexOf(order.status);
  const isException = order.status === "cancelled" || order.status === "rejected";
  const canCancel = ["new", "confirmed", "preparing"].includes(order.status);
  const tone = statusTone(order.status);
  const statusTimes = useMemo(
    () => new Map<OrderStatus, string>([["new", order.created_at]]),
    [order.created_at],
  );

  return (
    <div className="space-y-7">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-primary)]">
            {t.deliveryOrder}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            {order.order_number}
          </h1>
        </div>
        <span
          className="mt-1 inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold"
          style={{
            borderColor: `color-mix(in srgb, ${tone} 38%, transparent)`,
            background: `color-mix(in srgb, ${tone} 12%, transparent)`,
            color: tone,
          }}
        >
          <span className="h-2 w-2 rounded-full" style={{ background: tone }} aria-hidden="true" />
          {statusLabels[order.status]}
        </span>
      </header>

      <section
        className="rounded-[1.35rem] border p-5 shadow-[var(--shadow-card)] sm:p-6"
        style={{
          borderColor: `color-mix(in srgb, ${tone} 22%, var(--glass-border))`,
          background: `color-mix(in srgb, ${tone} 9%, var(--color-surface))`,
        }}
        aria-live="polite"
      >
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3" aria-hidden="true">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
              style={{ background: tone }}
            />
            <span
              className="relative inline-flex h-3 w-3 rounded-full"
              style={{ background: tone }}
            />
          </span>
          <h2 className="text-lg font-semibold tracking-tight">{statusLabels[order.status]}</h2>
        </div>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          {t.payment}: {order.payment_method === "cash" ? t.paymentCash : order.payment_status}
          <span className="mx-2 opacity-50">·</span>
          {order.order_type === "table"
            ? `${t.order} ${order.dining_tables?.[0]?.table_number ?? ""}`
            : t.deliveryOrder}
        </p>
      </section>

      {isException ? (
        <section
          className="rounded-[1.25rem] border p-4 text-sm"
          style={{
            borderColor: `color-mix(in srgb, ${tone} 34%, transparent)`,
            color: tone,
            background: `color-mix(in srgb, ${tone} 8%, transparent)`,
          }}
        >
          <p className="font-semibold">{statusLabels[order.status]}</p>
          <p className="mt-1 text-[var(--color-text-muted)]">{t.trackingHint}</p>
        </section>
      ) : (
        <section aria-label={t.trackingHint}>
          <div className="relative space-y-6">
            <div
              className="absolute inset-inline-start-[0.7rem] top-3 bottom-3 w-px bg-[var(--color-border)]"
              aria-hidden="true"
            />
            {statusSteps.map((step, index) => {
              const reached = currentStep >= index;
              const completed = currentStep > index;
              const active = currentStep === index;
              const timestamp = statusTimes.get(step);
              return (
                <div className="relative z-10 flex items-start gap-4" key={step}>
                  <div
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 bg-[var(--color-surface)] text-xs font-bold transition-all duration-300"
                    style={{
                      borderColor: reached ? tone : "var(--color-border)",
                      background: completed ? tone : "var(--color-surface)",
                      color: completed
                        ? "var(--color-on-brand)"
                        : active
                          ? tone
                          : "var(--color-text-muted)",
                      boxShadow: active
                        ? `0 0 0 5px color-mix(in srgb, ${tone} 14%, transparent)`
                        : undefined,
                    }}
                    aria-hidden="true"
                  >
                    {completed ? "✓" : active ? "•" : ""}
                  </div>
                  <div className="min-w-0 flex-1 pb-0.5">
                    <p
                      className={`text-sm ${reached ? "font-semibold" : "font-medium text-[var(--color-text-muted)]"}`}
                      style={active ? { color: tone } : undefined}
                    >
                      {stepLabels[step]}
                    </p>
                    {timestamp ? (
                      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                        {formatDate(timestamp, locale)}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="flex items-end justify-between gap-4 border-t border-[var(--color-border)] pt-6">
        <div className="min-w-0 text-sm leading-relaxed text-[var(--color-text-muted)]">
          {order.status === "ready" ? (
            <div className="grid gap-3">
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
                className="min-h-10 w-fit rounded-[var(--radius-pill)] bg-[var(--color-brand-secondary)] px-4 text-sm font-semibold text-[var(--color-on-brand)] transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {confirmingDelivery ? t.submitting : t.confirmDelivery}
              </button>
              {deliveryMessage ? (
                <span className="text-xs text-[var(--color-success)]" role="status">
                  {deliveryMessage}
                </span>
              ) : null}
              {canCancel ? (
                <CancellationAction
                  confirming={confirmingCancellation}
                  open={showCancellationPrompt}
                  onOpen={() => setShowCancellationPrompt(true)}
                  onKeep={() => setShowCancellationPrompt(false)}
                  onConfirm={async () => {
                    setConfirmingCancellation(true);
                    const result = await cancelPublicOrder(orderNumber, token);
                    if (result.success) {
                      setOrder((current) => ({ ...current, status: "cancelled" }));
                      setDeliveryMessage(t.cancellationConfirmed);
                      setShowCancellationPrompt(false);
                    } else {
                      setDeliveryMessage(t.cancellationError);
                    }
                    setConfirmingCancellation(false);
                  }}
                  labels={t}
                />
              ) : null}
            </div>
          ) : order.status === "delivered" ? (
            t.deliveryConfirmed
          ) : order.status === "cancelled" ? (
            t.cancellationConfirmed
          ) : (
            <div className="grid gap-3">
              <span>{t.contactCourier}</span>
              {canCancel ? (
                <CancellationAction
                  confirming={confirmingCancellation}
                  open={showCancellationPrompt}
                  onOpen={() => setShowCancellationPrompt(true)}
                  onKeep={() => setShowCancellationPrompt(false)}
                  onConfirm={async () => {
                    setConfirmingCancellation(true);
                    const result = await cancelPublicOrder(orderNumber, token);
                    if (result.success) {
                      setOrder((current) => ({ ...current, status: "cancelled" }));
                      setDeliveryMessage(t.cancellationConfirmed);
                      setShowCancellationPrompt(false);
                    } else {
                      setDeliveryMessage(t.cancellationError);
                    }
                    setConfirmingCancellation(false);
                  }}
                  labels={t}
                />
              ) : null}
            </div>
          )}
        </div>
        <a
          className="shrink-0 text-sm font-semibold text-[var(--color-text-primary)] underline decoration-[var(--color-brand-primary)] underline-offset-4 transition hover:text-[var(--color-brand-primary)]"
          href="/menu"
        >
          {t.menu}
        </a>
      </div>
    </div>
  );
}

function CancellationAction({
  confirming,
  open,
  onOpen,
  onKeep,
  onConfirm,
  labels,
}: {
  confirming: boolean;
  open: boolean;
  onOpen: () => void;
  onKeep: () => void;
  onConfirm: () => void;
  labels: ReturnType<typeof getPublicCopy>;
}) {
  if (!open) {
    return (
      <button
        type="button"
        disabled={confirming}
        onClick={onOpen}
        className="min-h-10 w-fit rounded-[var(--radius-pill)] border border-[var(--color-danger-border)] bg-[var(--color-danger-soft)] px-4 text-sm font-semibold text-[var(--color-danger)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {labels.cancelOrder}
      </button>
    );
  }
  return (
    <div className="grid gap-2 rounded-[var(--radius-md)] border border-[var(--color-danger-border)] bg-[var(--color-danger-soft)] p-3 text-[var(--color-danger)]">
      <span className="text-xs font-semibold">{labels.cancelOrderQuestion}</span>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={confirming}
          onClick={onConfirm}
          className="min-h-9 rounded-[var(--radius-pill)] bg-[var(--color-danger)] px-3 text-xs font-semibold text-[var(--color-on-brand)] disabled:opacity-60"
        >
          {confirming ? labels.submitting : labels.confirmCancel}
        </button>
        <button
          type="button"
          disabled={confirming}
          onClick={onKeep}
          className="min-h-9 rounded-[var(--radius-pill)] border border-current px-3 text-xs font-semibold disabled:opacity-60"
        >
          {labels.keepOrder}
        </button>
      </div>
    </div>
  );
}
