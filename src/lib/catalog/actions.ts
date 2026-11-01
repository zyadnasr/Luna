"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import type { ProductFormData } from "@/types/catalog";

type ActionResult = { success: boolean; message: string };
const locales = ["ar", "en", "it"] as const;

export async function saveProduct(form: ProductFormData): Promise<ActionResult> {
  const user = await requireRole("owner");
  const supabase = await createClient();
  if (!form.translations.find((translation) => translation.locale === "ar")?.name.trim())
    return { success: false, message: "اسم المنتج بالعربية مطلوب." };
  const activeLabels = form.prices
    .filter((price) => price.is_active)
    .map((price) => price.label.trim())
    .filter(Boolean);
  if (new Set(activeLabels).size !== activeLabels.length)
    return { success: false, message: "لا يمكن تكرار اسم السعر النشط." };
  for (const price of form.prices) {
    if (Number(price.price_egp) <= 0)
      return { success: false, message: "يجب أن يكون السعر أكبر من صفر." };
    if (
      price.valid_until &&
      price.valid_from &&
      new Date(price.valid_until) < new Date(price.valid_from)
    )
      return { success: false, message: "تاريخ الانتهاء لا يمكن أن يسبق تاريخ البداية." };
  }
  const productPayload = {
    category_id: form.category_id || null,
    sku: form.sku.trim() || null,
    is_active: form.is_active,
    availability_status: form.availability_status,
  };
  let productId = form.id;
  if (productId) {
    const { error } = await supabase.from("products").update(productPayload).eq("id", productId);
    if (error) return { success: false, message: "تعذر تحديث المنتج." };
  } else {
    const { data, error } = await supabase
      .from("products")
      .insert(productPayload)
      .select("id")
      .single();
    if (error || !data) return { success: false, message: "تعذر إنشاء المنتج." };
    productId = data.id;
  }
  await supabase.from("product_translations").delete().eq("product_id", productId);
  const translationRows = form.translations
    .filter((translation) => translation.name.trim())
    .map((translation) => ({
      product_id: productId,
      locale: translation.locale,
      name: translation.name.trim(),
      description: translation.description.trim() || null,
      ingredients_text: translation.ingredients_text.trim() || null,
      allergens_text: translation.allergens_text.trim() || null,
    }));
  const { error: translationError } = await supabase
    .from("product_translations")
    .insert(translationRows);
  if (translationError) return { success: false, message: "تعذر حفظ ترجمات المنتج." };
  await supabase.from("product_prices").delete().eq("product_id", productId);
  const priceRows = form.prices
    .filter((price) => price.label.trim() || Number(price.price_egp) > 0)
    .map((price) => ({
      product_id: productId,
      label: price.label.trim() || null,
      price_egp: Number(price.price_egp),
      is_active: price.is_active,
      valid_from: price.valid_from || new Date().toISOString(),
      valid_until: price.valid_until || null,
    }));
  if (priceRows.length) {
    const { error: priceError } = await supabase.from("product_prices").insert(priceRows);
    if (priceError) return { success: false, message: "تعذر حفظ الأسعار." };
    await supabase.from("audit_logs").insert({
      actor_user_id: user.id,
      action: "price.updated",
      entity_type: "product_price",
      entity_id: productId,
      metadata: { count: priceRows.length },
    });
  }
  await supabase.from("nutrition_facts").delete().eq("product_id", productId);
  const nutrition = form.nutrition;
  const hasNutrition = Object.values(nutrition).some((value) => value !== null && value !== "");
  if (hasNutrition) {
    await supabase.from("nutrition_facts").insert({ ...nutrition, product_id: productId });
    await supabase.from("audit_logs").insert({
      actor_user_id: user.id,
      action: "nutrition.updated",
      entity_type: "nutrition_facts",
      entity_id: productId,
      metadata: {},
    });
  }
  await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    action: form.id ? "product.updated" : "product.created",
    entity_type: "product",
    entity_id: productId,
    metadata: {
      locales: locales.filter((locale) =>
        form.translations.some(
          (translation) => translation.locale === locale && translation.name.trim(),
        ),
      ),
    },
  });
  revalidatePath("/menu");
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  return { success: true, message: form.id ? "تم تحديث المنتج." : "تم إنشاء المنتج." };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const user = await requireRole("owner");
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") {
      return { success: false, message: "لا يمكن حذف منتج مرتبط بطلبات سابقة." };
    }
    return { success: false, message: "تعذر حذف المنتج." };
  }
  await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    action: "product.deleted",
    entity_type: "product",
    entity_id: id,
    metadata: {},
  });
  revalidatePath("/menu");
  revalidatePath("/admin/products");
  return { success: true, message: "تم حذف المنتج نهائيًا." };
}

export async function setProductAvailability(
  id: string,
  availability_status: ProductFormData["availability_status"],
): Promise<ActionResult> {
  const user = await requireRole("owner");
  const supabase = await createClient();
  const { error } = await supabase.from("products").update({ availability_status }).eq("id", id);
  if (error) return { success: false, message: "تعذر تحديث حالة المنتج." };
  await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    action: "product.availability_changed",
    entity_type: "product",
    entity_id: id,
    metadata: { availability_status },
  });
  revalidatePath("/menu");
  revalidatePath("/admin/products");
  return { success: true, message: "تم تحديث الحالة." };
}
