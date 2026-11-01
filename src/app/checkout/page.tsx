import { createClient } from "@/lib/supabase/server";
import { PageContainer } from "@/components/ui/page-container";
import { CheckoutContent } from "@/components/orders/checkout-content";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const supabase = await createClient();
  const { data: zones } = await supabase
    .from("delivery_zones")
    .select("id, name_ar, name_en, name_it, delivery_fee_egp")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <PageContainer className="max-w-6xl">
      <CheckoutContent zones={zones ?? []} />
    </PageContainer>
  );
}
