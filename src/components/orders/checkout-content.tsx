"use client";

import { useState } from "react";
import { CheckoutForm } from "./checkout-form";
import { CheckoutSummary } from "./checkout-summary";
import { useLocale } from "@/components/ui/locale-provider";
import { getPublicCopy } from "@/i18n/public";

type DeliveryZone = {
  id: string;
  name_ar: string;
  name_en?: string;
  name_it?: string;
  delivery_fee_egp: number;
};

export function CheckoutContent({ zones }: { zones: DeliveryZone[] }) {
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const { locale } = useLocale();
  const t = getPublicCopy(locale);

  return (
    <>
      <header className="border-b border-[var(--color-border)] pb-7">
        <p className="text-sm font-semibold text-[var(--color-brand-primary)]">{t.deliveryData}</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-6xl">{t.checkout}</h1>
        <p className="mt-4 text-[var(--color-text-muted)]">{t.recheck}</p>
      </header>
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
        <CheckoutSummary deliveryFee={deliveryFee} />
        <section className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] sm:p-7">
          <h2 className="text-xl font-semibold">{t.deliveryData}</h2>
          <div className="mt-5">
            <CheckoutForm
              zones={zones}
              context={{ type: "delivery" }}
              onDeliveryFeeChange={setDeliveryFee}
            />
          </div>
        </section>
      </div>
    </>
  );
}
