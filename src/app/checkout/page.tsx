import { createClient } from "@/lib/supabase/server";
import { PageContainer } from "@/components/ui/page-container";
import { CheckoutForm } from "@/components/orders/checkout-form";
import { CheckoutSummary } from "@/components/orders/checkout-summary";
import { getServerLocale } from "@/i18n/server";
import { getPublicCopy } from "@/i18n/public";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const supabase = await createClient();
  const locale = await getServerLocale();
  const t = getPublicCopy(locale);
  const { data: zones } = await supabase
    .from("delivery_zones")
    .select("id, name_ar, name_en, name_it, delivery_fee_egp")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <PageContainer className="max-w-6xl">
      <header className="border-b border-[var(--color-border)] pb-7">
        <p className="text-sm font-semibold text-[var(--color-brand-primary)]">{t.deliveryData}</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-6xl">{t.checkout}</h1>
        <p className="mt-4 text-[var(--color-text-muted)]">{t.recheck}</p>
      </header>
      <div className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <CheckoutSummary />
        <section className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] sm:p-7">
          <h2 className="text-xl font-semibold">{t.deliveryData}</h2>
          <div className="mt-6">
            <CheckoutForm zones={zones ?? []} context={{ type: "delivery" }} />
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
