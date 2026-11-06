"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { ProductFormData } from "@/types/catalog";

type ActionResult = { success: boolean; message: string; productId?: string };
const locales = ["ar", "en", "it"] as const;

const maxProductImageSize = 5 * 1024 * 1024;
const allowedProductImageTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function saveProduct(form: ProductFormData): Promise<ActionResult> {
  try {
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
        price.compare_at_price_egp !== null &&
        price.compare_at_price_egp !== undefined &&
        price.compare_at_price_egp !== "" &&
        Number(price.compare_at_price_egp) < Number(price.price_egp)
      )
        return { success: false, message: "السعر الأصلي لا يمكن أن يكون أقل من سعر البيع." };
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
      .upsert(translationRows, { onConflict: "product_id,locale" });
    if (translationError) return { success: false, message: "تعذر حفظ ترجمات المنتج." };
    const { data: existingPrices, error: existingPricesError } = await supabase
      .from("product_prices")
      .select("id")
      .eq("product_id", productId);
    if (existingPricesError) return { success: false, message: "تعذر قراءة الأسعار الحالية." };
    const priceRows = form.prices
      .filter((price) => price.label.trim() || Number(price.price_egp) > 0)
      .map((price) => ({
        ...(price.id ? { id: price.id } : {}),
        product_id: productId,
        label: price.label.trim() || null,
        price_egp: Number(price.price_egp),
        compare_at_price_egp:
          price.compare_at_price_egp === null ||
          price.compare_at_price_egp === undefined ||
          price.compare_at_price_egp === ""
            ? null
            : Number(price.compare_at_price_egp),
        is_active: price.is_active,
        valid_from: price.valid_from || new Date().toISOString(),
        valid_until: price.valid_until || null,
      }));
    if (priceRows.length) {
      const { error: priceError } = await supabase
        .from("product_prices")
        .upsert(priceRows, { onConflict: "id" });
      if (priceError) return { success: false, message: "تعذر حفظ الأسعار." };
      await supabase.from("audit_logs").insert({
        actor_user_id: user.id,
        action: "price.updated",
        entity_type: "product_price",
        entity_id: productId,
        metadata: { count: priceRows.length },
      });
    }
    const submittedPriceIds = priceRows.flatMap((price) => ("id" in price ? [price.id] : []));
    const stalePriceIds = (existingPrices ?? [])
      .map((price) => price.id)
      .filter((id) => !submittedPriceIds.includes(id));
    if (stalePriceIds.length) {
      const { error: stalePricesError } = await supabase
        .from("product_prices")
        .delete()
        .eq("product_id", productId)
        .in("id", stalePriceIds);
      if (stalePricesError) return { success: false, message: "تعذر تحديث الأسعار." };
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
    return {
      success: true,
      message: form.id ? "تم تحديث المنتج." : "تم إنشاء المنتج.",
      productId,
    };
  } catch {
    return { success: false, message: "تعذر حفظ المنتج. حاول مرة أخرى." };
  }
}

export async function saveProductImage(
  productId: string,
  file: File,
): Promise<ActionResult> {
  try {
    const user = await requireRole("owner");
    if (!allowedProductImageTypes.has(file.type) || file.size <= 0 || file.size > maxProductImageSize)
      return { success: false, message: "صورة المنتج يجب أن تكون PNG أو JPG أو WEBP وبحد أقصى 5 ميجابايت." };

    const service = createServiceClient();
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `products/${productId}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await service.storage
      .from("product-media")
      .upload(path, file, {
        cacheControl: "31536000",
        contentType: file.type,
        upsert: false,
      });
    if (uploadError) return { success: false, message: "تعذر رفع صورة المنتج." };

    const imageUrl = service.storage.from("product-media").getPublicUrl(path).data.publicUrl;
    const supabase = await createClient();
    const { error: updateError } = await supabase
      .from("products")
      .update({ image_url: imageUrl })
      .eq("id", productId);
    if (updateError) return { success: false, message: "تعذر حفظ صورة المنتج." };

    await supabase.from("audit_logs").insert({
      actor_user_id: user.id,
      action: "product.image_updated",
      entity_type: "product",
      entity_id: productId,
      metadata: { path },
    });
    revalidatePath("/menu");
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}`);
    return { success: true, message: "تم حفظ صورة المنتج." };
  } catch {
    return { success: false, message: "تعذر رفع صورة المنتج." };
  }
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
