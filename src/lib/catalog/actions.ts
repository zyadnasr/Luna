"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getProductImageType, isValidProductImage } from "@/lib/catalog/image-validation";
import type { ProductFormData } from "@/types/catalog";

type ActionResult = { success: boolean; message: string; productId?: string; debugStage?: string };
const locales = ["ar", "en", "it"] as const;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function logDatabaseFailure(
  operation: string,
  error: unknown,
  context: Record<string, unknown> = {},
) {
  const databaseError = error as {
    code?: string;
    details?: string;
    hint?: string;
    message?: string;
  };
  console.error("catalog database failure", {
    operation,
    code: databaseError.code ?? null,
    details: databaseError.details ?? null,
    hint: databaseError.hint ?? null,
    error: databaseError.message ?? getErrorMessage(error),
    ...context,
  });
}

function textValue(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function toIsoTimestamp(value: string | null | undefined, fallback: string | null = null) {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toISOString();
}

export async function saveProduct(form: ProductFormData): Promise<ActionResult> {
  // Keep authorization outside the persistence catch so Next.js redirects are
  // not converted into the misleading generic save error.
  const user = await requireRole("owner");
  let stage = "initialization";
  try {
    stage = "creating database client";
    // requireRole is the authorization boundary. Use the service client for
    // this multi-table owner write so one RLS decision cannot leave a product
    // half-saved after the owner has already been verified.
    const supabase = createServiceClient();
    stage = "validating product";
    if (!textValue(form.translations.find((translation) => translation.locale === "ar")?.name))
      return { success: false, message: "اسم المنتج بالعربية مطلوب." };
    const activeLabels = form.prices
      .filter((price) => price.is_active)
      .map((price) => textValue(price.label))
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
      const validFrom = toIsoTimestamp(price.valid_from);
      const validUntil = toIsoTimestamp(price.valid_until);
      if (validUntil && validFrom && new Date(validUntil) < new Date(validFrom))
        return { success: false, message: "تاريخ الانتهاء لا يمكن أن يسبق تاريخ البداية." };
    }
    const productPayload = {
      category_id: form.category_id || null,
      sku: textValue(form.sku) || null,
      is_active: form.is_active,
      availability_status: form.availability_status,
    };
    let productId = form.id;
    if (productId) {
      stage = "updating product";
      const { error } = await supabase.from("products").update(productPayload).eq("id", productId);
      if (error) {
        logDatabaseFailure(stage, error, { productId });
        return { success: false, message: "تعذر تحديث المنتج." };
      }
    } else {
      stage = "creating product";
      const { data, error } = await supabase
        .from("products")
        .insert(productPayload)
        .select("id")
        .single();
      if (error || !data) {
        logDatabaseFailure(stage, error ?? new Error("No product id returned"));
        return { success: false, message: "تعذر إنشاء المنتج." };
      }
      productId = data.id;
    }
    const translationRows = form.translations
      .filter((translation) => textValue(translation.name))
      .map((translation) => ({
        product_id: productId,
        locale: translation.locale,
        name: textValue(translation.name),
        description: textValue(translation.description) || null,
        ingredients_text: textValue(translation.ingredients_text) || null,
        allergens_text: textValue(translation.allergens_text) || null,
      }));
    stage = "saving translations";
    const { error: translationError } = await supabase
      .from("product_translations")
      .upsert(translationRows, { onConflict: "product_id,locale" });
    if (translationError) {
      logDatabaseFailure(stage, translationError, { productId, rowCount: translationRows.length });
      return { success: false, message: "تعذر حفظ ترجمات المنتج." };
    }
    stage = "reading current prices";
    const { data: existingPrices, error: existingPricesError } = await supabase
      .from("product_prices")
      .select("id")
      .eq("product_id", productId);
    if (existingPricesError) {
      logDatabaseFailure(stage, existingPricesError, { productId });
      return { success: false, message: "تعذر قراءة الأسعار الحالية." };
    }
    const priceRows = form.prices
      .filter((price) => textValue(price.label) || Number(price.price_egp) > 0)
      .map((price) => ({
        ...(price.id ? { id: price.id } : {}),
        product_id: productId,
        label: textValue(price.label) || null,
        price_egp: Number(price.price_egp),
        compare_at_price_egp:
          price.compare_at_price_egp === null ||
          price.compare_at_price_egp === undefined ||
          price.compare_at_price_egp === ""
            ? null
            : Number(price.compare_at_price_egp),
        is_active: price.is_active,
        valid_from: toIsoTimestamp(price.valid_from, new Date().toISOString()),
        valid_until: toIsoTimestamp(price.valid_until),
      }));
    if (priceRows.length) {
      stage = "saving prices";
      const { error: priceError } = await supabase
        .from("product_prices")
        .upsert(priceRows, { onConflict: "id" });
      if (priceError) {
        logDatabaseFailure(stage, priceError, { productId, rowCount: priceRows.length });
        return { success: false, message: "تعذر حفظ الأسعار." };
      }
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
      stage = "removing stale prices";
      const { error: stalePricesError } = await supabase
        .from("product_prices")
        .delete()
        .eq("product_id", productId)
        .in("id", stalePriceIds);
      if (stalePricesError) {
        logDatabaseFailure(stage, stalePricesError, { productId, stalePriceCount: stalePriceIds.length });
        return { success: false, message: "تعذر تحديث الأسعار." };
      }
    }
    stage = "writing audit log";
    await supabase.from("audit_logs").insert({
      actor_user_id: user.id,
      action: form.id ? "product.updated" : "product.created",
      entity_type: "product",
      entity_id: productId,
      metadata: {
        locales: locales.filter((locale) =>
          form.translations.some(
            (translation) => translation.locale === locale && textValue(translation.name),
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
  } catch (error) {
    console.error("saveProduct: unexpected failure", {
      productId: form.id ?? null,
      stage,
      error: getErrorMessage(error),
    });
    return {
      success: false,
      message: "تعذر حفظ المنتج. حاول مرة أخرى.",
      debugStage: `${stage}: ${getErrorMessage(error)}`,
    };
  }
}

export async function saveProductImage(
  productId: string,
  file: File,
): Promise<ActionResult> {
  // Authorization must remain outside the catch so redirects are preserved.
  const user = await requireRole("owner");
  let uploadedPath: string | null = null;
  try {
    const contentType = getProductImageType(file);
    if (!contentType || !isValidProductImage(file))
      return { success: false, message: "صورة المنتج يجب أن تكون PNG أو JPG أو WEBP وبحد أقصى 5 ميجابايت." };

    const service = createServiceClient();
    const extension = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
    const path = `products/${productId}/${crypto.randomUUID()}.${extension}`;
    uploadedPath = path;
    const { error: uploadError } = await service.storage
      .from("product-media")
      .upload(path, file, {
        cacheControl: "31536000",
        contentType,
        upsert: false,
      });
    if (uploadError) {
      console.error("saveProductImage: storage upload failed", {
        productId,
        fileName: file.name,
        fileType: file.type,
        normalizedType: contentType,
        fileSize: file.size,
        code: uploadError.name,
        error: uploadError.message,
      });
      return {
        success: false,
        message: "تعذر رفع صورة المنتج. حاول مرة أخرى.",
        debugStage: `storage upload: ${uploadError.name}: ${uploadError.message}`,
      };
    }

    const imageUrl = service.storage.from("product-media").getPublicUrl(path).data.publicUrl;
    // The service client is already authorized by requireRole("owner") and
    // avoids a second RLS decision after the storage upload succeeds.
    const { error: updateError } = await service
      .from("products")
      .update({ image_url: imageUrl })
      .eq("id", productId);
    if (updateError) {
      console.error("saveProductImage: product update failed", {
        productId,
        path,
        error: updateError.message,
      });
      await service.storage.from("product-media").remove([path]);
      uploadedPath = null;
      return {
        success: false,
        message: "تم رفع الصورة لكن تعذر ربطها بالمنتج. حاول مرة أخرى.",
      };
    }

    await service.from("audit_logs").insert({
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
  } catch (error) {
    console.error("saveProductImage: unexpected failure", {
      productId,
      uploadedPath,
      error: getErrorMessage(error),
    });
    if (uploadedPath) {
      try {
        const service = createServiceClient();
        await service.storage.from("product-media").remove([uploadedPath]);
      } catch (cleanupError) {
        console.error("saveProductImage: cleanup failed", {
          uploadedPath,
          error: getErrorMessage(cleanupError),
        });
      }
    }
    return {
      success: false,
      message: "تعذر رفع صورة المنتج. حاول مرة أخرى.",
      debugStage: `image upload: ${getErrorMessage(error)}`,
    };
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
