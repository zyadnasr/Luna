"use client";

import { getTranslations } from "@/i18n";
import { useLocale } from "@/components/ui/locale-provider";
type PaymentEvent = {
  id: string;
  status: string;
  created_at: string;
  notes: string | null;
  verified_by: string | null;
};
export function PaymentTimeline({ payments }: { payments: PaymentEvent[] }) {
  const { locale } = useLocale();
  const t = getTranslations(locale);
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <h2 className="text-xl font-semibold">{t.orders.fields.timeline}</h2>
      {!payments.length ? (
        <p className="mt-4 text-sm text-[var(--color-text-muted)]">
          {t.orders.messages.noActivity}
        </p>
      ) : (
        <div className="mt-5 grid gap-4">
          {payments.map((payment) => (
            <div className="border-s border-[var(--color-border-strong)] ps-4" key={payment.id}>
              <p className="font-semibold">{t.orders.payment[payment.status] ?? payment.status}</p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                {new Date(payment.created_at).toLocaleString(locale === "ar" ? "ar-EG" : locale)}
                {payment.verified_by ? ` · ${t.orders.fields.actor}` : ""}
              </p>
              {payment.notes ? (
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{payment.notes}</p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
