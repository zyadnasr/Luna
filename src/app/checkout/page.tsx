import { createClient } from "@/lib/supabase/server";
import { PageContainer } from "@/components/ui/page-container";
import { CheckoutContent } from "@/components/orders/checkout-content";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const supabase = await createClient();
  const [{ data: zones }, { data: minimumOrderSetting }] = await Promise.all([
    supabase
      .from("delivery_zones")
      .select("id, name_ar, name_en, name_it, delivery_fee_egp")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "minimum_order_egp")
      .eq("is_public", true)
      .maybeSingle(),
  ]);
  const minimumOrderEgp = Number(minimumOrderSetting?.value ?? 90);

  return (
    <PageContainer className="max-w-6xl">
      <CheckoutContent zones={zones ?? []} minimumOrderEgp={minimumOrderEgp} />
    </PageContainer>
  );
}
