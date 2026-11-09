"use client";

import { useEffect, useState, useTransition } from "react";
import { updateOrderStatus } from "@/lib/orders/actions";
import type { OrderStatus } from "@/types/orders";
import { useLocale } from "@/components/ui/locale-provider";
import { getTranslations } from "@/i18n";
import { translateAdminText } from "@/i18n/admin-text";

const flow: OrderStatus[] = ["new", "confirmed", "preparing", "ready", "delivered"];
const transitions: Partial<Record<OrderStatus, OrderStatus[]>> = {
  new: ["confirmed", "rejected"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["delivered", "cancelled"],
};

const copy = {
  ar: {
    title: "تنفيذ الطلب",
    description: "تابع وعدّل حالة الطلب من مكان واحد.",
    actions: "الإجراءات المطلوبة",
    noActions: "لا توجد إجراءات أخرى مطلوبة.",
    cancelled: "تم إلغاء الطلب",
    rejected: "تم رفض الطلب",
    outOfFlow: "تم إخراج الطلب من مسار التنفيذ.",
    saving: "جارٍ الحفظ...",
    saveError: "تعذر تحديث الحالة.",
  },
  en: {
    title: "Order fulfillment",
    description: "Track and update this order from one place.",
    actions: "Required actions",
    noActions: "No further actions required.",
    cancelled: "Order cancelled",
    rejected: "Order rejected",
    outOfFlow: "This order has been moved out of the fulfillment flow.",
    saving: "Saving...",
    saveError: "Unable to update the status.",
  },
  it: {
    title: "Evasione ordine",
    description: "Segui e aggiorna questo ordine da un unico posto.",
    actions: "Azioni richieste",
    noActions: "Nessun'altra azione richiesta.",
    cancelled: "Ordine annullato",
    rejected: "Ordine rifiutato",
    outOfFlow: "Questo ordine è stato rimosso dal flusso di evasione.",
    saving: "Salvataggio...",
    saveError: "Impossibile aggiornare lo stato.",
  },
} as const;

const actionLabels = {
  ar: {
    confirmed: "تأكيد الطلب",
    preparing: "بدء التجهيز",
    ready: "تحديد كجاهز",
    delivered: "تحديد كمسلّم",
    cancelled: "إلغاء الطلب",
    rejected: "رفض الطلب",
  },
  en: {
    confirmed: "Confirm order",
    preparing: "Start preparing",
    ready: "Mark as ready",
    delivered: "Mark as delivered",
    cancelled: "Cancel order",
    rejected: "Reject order",
  },
  it: {
    confirmed: "Conferma ordine",
    preparing: "Inizia preparazione",
    ready: "Segna come pronto",
    delivered: "Segna come consegnato",
    cancelled: "Annulla ordine",
    rejected: "Rifiuta ordine",
  },
} as const;

function statusTone(status: OrderStatus) {
  if (status === "delivered")
    return "border-[var(--color-success-border)] bg-[var(--color-success-soft)] text-[var(--color-success)]";
  if (status === "cancelled" || status === "rejected")
    return "border-[var(--color-danger-border)] bg-[var(--color-danger-soft)] text-[var(--color-danger)]";
  if (status === "new")
    return "border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 text-[var(--color-warning)]";
  return "border-[var(--color-info)]/30 bg-[var(--color-info)]/10 text-[var(--color-info)]";
}

export function StatusTransition({
  id,
  status,
  orderNumber,
  token,
}: {
  id: string;
  status: OrderStatus;
  orderNumber: string;
  token: string;
}) {
  const { locale } = useLocale();
  const t = getTranslations(locale);
  const labels = copy[locale];
  const [value, setValue] = useState(status);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const currentIndex = flow.indexOf(value);
  const availableActions = transitions[value] ?? [];

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
        if (response.ok && active) {
          const payload = (await response.json()) as { status: OrderStatus };
          setValue(payload.status);
        }
      } catch {
        // Keep the current state if a refresh temporarily fails.
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

  function save(next: OrderStatus) {
    setMessage("");
    startTransition(async () => {
      const result = await updateOrderStatus(id, next);
      if (result.success) setValue(next);
      setMessage(translateAdminText(locale, result.message) || labels.saveError);
    });
  }

  return (
    <div className="flex flex-col">
      <div>
        <h2 className="text-xl font-bold tracking-tight">{labels.title}</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-[var(--color-text-muted)]">
          {labels.description}
        </p>
      </div>
      {value === "cancelled" || value === "rejected" ? (
        <div
          className={`mt-8 rounded-[var(--radius-md)] border p-6 text-center ${statusTone(value)}`}
        >
          <div className="mx-auto grid size-12 place-items-center rounded-full border border-current/25 text-xl">
            ×
          </div>
          <h3 className="mt-3 text-lg font-bold">
            {value === "cancelled" ? labels.cancelled : labels.rejected}
          </h3>
          <p className="mt-1 text-sm opacity-80">{labels.outOfFlow}</p>
        </div>
      ) : (
        <div className="mt-8 max-w-full overflow-x-auto pb-2 sm:mt-10">
          <div className="relative flex min-w-[440px] justify-between gap-3 px-2 sm:min-w-[560px] sm:gap-4 sm:px-5">
            <div className="absolute start-7 end-7 top-5 h-1 rounded-full bg-[var(--color-background-deep)]" />
            <div
              className="absolute start-7 top-5 h-1 rounded-full bg-[var(--color-brand-primary)] transition-all duration-300"
              style={{
                width: `${Math.max(0, (currentIndex / (flow.length - 1)) * 100)}%`,
                maxWidth: "calc(100% - 3.5rem)",
              }}
            />
            {flow.map((step, index) => {
              const reached = currentIndex >= index;
              const active = value === step;
              return (
                <div
                  className="relative z-10 flex w-20 shrink-0 flex-col items-center text-center"
                  key={step}
                >
                  <div
                    className={`grid size-10 place-items-center rounded-full border-2 text-sm font-bold transition ${active ? "scale-110 border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)] text-[var(--color-on-brand)] shadow-[var(--shadow-soft)]" : reached ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)] text-[var(--color-on-brand)]" : "border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text-muted)]"}`}
                  >
                    {reached && !active ? "✓" : index + 1}
                  </div>
                  <span
                    className={`mt-3 text-xs font-semibold ${active ? "text-[var(--color-brand-primary-deep)]" : reached ? "text-[var(--color-text-secondary)]" : "text-[var(--color-text-muted)]"}`}
                  >
                    {t.orders.status[step]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div className="mt-8 border-t border-[var(--color-border)] pt-6">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          {labels.actions}
        </h3>
        <div className="mt-4 flex flex-wrap gap-3">
          {availableActions.length ? (
            availableActions.map((next) => {
              const destructive = next === "cancelled" || next === "rejected";
              return (
                <button
                  className={`inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] px-4 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 ${destructive ? "border border-[var(--color-danger-border)] bg-[var(--color-danger-soft)] text-[var(--color-danger)]" : "bg-[var(--color-brand-primary)] text-[var(--color-on-brand)] shadow-[var(--shadow-soft)] hover:bg-[var(--color-brand-primary-deep)]"}`}
                  disabled={isPending}
                  key={next}
                  onClick={() => save(next)}
                  type="button"
                >
                  <span aria-hidden="true">{destructive ? "×" : "✓"}</span>
                  {isPending
                    ? labels.saving
                    : actionLabels[locale][next as keyof (typeof actionLabels)[typeof locale]]}
                </button>
              );
            })
          ) : (
            <span className="text-sm italic text-[var(--color-text-muted)]">
              {labels.noActions}
            </span>
          )}
        </div>
        {message ? (
          <p className="mt-4 text-sm text-[var(--color-text-secondary)]" role="status">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
