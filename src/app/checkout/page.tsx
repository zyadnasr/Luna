import { createClient } from "@/lib/supabase/server";
import { PageContainer } from "@/components/ui/page-container";
import { CheckoutContent } from "@/components/orders/checkout-content";
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
      <CheckoutContent zones={zones ?? []} />
    </PageContainer>
  );
}
