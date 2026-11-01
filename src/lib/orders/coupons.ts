"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function createCoupon(formData: FormData) {
  const user = await requireRole("owner");
  const writer = createServiceClient();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const name = String(formData.get("name") ?? "").trim();
  const discountPercent = Number(formData.get("discount_percent") ?? 0);
  const maxUsesRaw = String(formData.get("max_uses") ?? "").trim();
  const maxUses = maxUsesRaw ? Number(maxUsesRaw) : null;
  const productIds = formData.getAll("product_id").map(String).filter(Boolean);
  if (!/^[A-Z0-9_-]{3,32}$/.test(code) || !name || discountPercent <= 0 || discountPercent > 100)
    return;
  const { data: coupon, error } = await writer
    .from("coupons")
    .insert({
      code,
      name,
      discount_percent: discountPercent,
      max_uses: maxUses,
      applies_to_all: productIds.length === 0,
    })
    .select("id")
    .single();
  if (error || !coupon) return;
  if (productIds.length)
    await writer.from("coupon_products").insert(productIds.map((product_id) => ({ coupon_id: coupon.id, product_id })));
  await writer.from("audit_logs").insert({
    actor_user_id: user.id,
    action: "coupon.created",
    entity_type: "coupon",
    entity_id: coupon.id,
    metadata: { code },
  });
  revalidatePath("/admin/coupons");
}

export async function toggleCoupon(id: string, isActive: boolean) {
  const user = await requireRole("owner");
  const writer = createServiceClient();
  await writer.from("coupons").update({ is_active: isActive }).eq("id", id);
  await writer.from("audit_logs").insert({
    actor_user_id: user.id,
    action: isActive ? "coupon.activated" : "coupon.deactivated",
    entity_type: "coupon",
    entity_id: id,
    metadata: {},
  });
  revalidatePath("/admin/coupons");
}
