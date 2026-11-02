"use server";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { notifyTelegram, orderNotification } from "@/lib/orders/telegram";
import type { OrderErrorCode, OrderInput, OrderResult, OrderStatus } from "@/types/orders";
import {
  isValidCustomerName,
  isValidDeliveryAddress,
  isValidLocationUrl,
  isValidEgyptianPhone,
  isValidPaymentProof,
  normalizeCustomerName,
  normalizeDeliveryAddress,
  normalizeEgyptianPhone,
} from "./validation";
import { getProductAvailability } from "@/lib/inventory/availability";
import type { OrderSource } from "@/types/domain";

const transitions: Record<OrderStatus, OrderStatus[]> = {
  new: ["confirmed", "rejected", "cancelled"],
  confirmed: ["preparing", "cancelled", "rejected"],
  preparing: ["ready", "cancelled"],
  ready: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
  rejected: [],
};
const errorCodeByMessage: Record<string, OrderErrorCode> = {
  "تعذر إنشاء الطلب حاليًا. حاول مرة أخرى.": "generic",
  "أضف منتجًا واحدًا على الأقل.": "emptyCart",
  "الدفع بالفيزا غير متاح حاليًا.": "cardUnavailable",
  "الدفع عبر Instapay غير مكوّن حاليًا.": "instapayNotConfigured",
  "إثبات الدفع مطلوب بصيغة PNG أو JPG أو WEBP وحجم أقل من 5 ميجابايت.": "paymentProofRequired",
  "اكتب اسمًا صحيحًا مكوّنًا من حروف عربية أو إنجليزية فقط.": "invalidName",
  "أدخل رقم هاتف مصري صحيحًا مكوّنًا من 10 أرقام بعد +20.": "invalidPhone",
  "أدخل عنوانًا صحيحًا للتوصيل.": "invalidAddress",
  "حدد موقع التوصيل من الخريطة قبل إرسال الطلب.": "invalidLocation",
  "سياق الطاولة غير صالح.": "invalidTableContext",
  "بيانات التوصيل مطلوبة.": "deliveryRequired",
  "رمز الطاولة غير صالح أو غير نشط.": "invalidQrCode",
  "أحد المنتجات لم يعد متاحًا.": "productUnavailable",
  "أحد اختيارات السلة لم يعد متاحًا.": "cartSelectionUnavailable",
  "المنتج غير متاح بسبب وصفة أو مخزون غير كافٍ.": "insufficientStock",
  "منطقة التوصيل غير متاحة.": "zoneUnavailable",
  "كود الخصم غير صالح لهذا الطلب.": "invalidCoupon",
  "تعذر إنشاء الطلب. حاول مرة أخرى.": "createOrderFailed",
  "تعذر رفع إثبات الدفع. حاول مرة أخرى.": "uploadProofFailed",
  "تعذر حفظ تفاصيل الطلب.": "saveOrderItemsFailed",
};
const fail = (
  message: string,
  errorCode = errorCodeByMessage[message] ?? "generic",
): OrderResult => ({
  success: false,
  message,
  errorCode,
});

export async function validatePublicCoupon(input: {
  code: string;
  items: Array<{ productId: string; quantity: number }>;
}): Promise<{ success: boolean; discountPercent?: number }> {
  const code = input.code.trim().toUpperCase();
  if (!code || !input.items.length) return { success: false };
  const writer = createServiceClient();
  const ids = [...new Set(input.items.map((item) => item.productId))];
  const { data: coupon } = await writer
    .from("coupons")
    .select(
      "discount_percent, applies_to_all, max_uses, uses_count, starts_at, ends_at, coupon_products(product_id)",
    )
    .eq("code", code)
    .eq("is_active", true)
    .maybeSingle();
  const now = new Date();
  const withinDates =
    coupon &&
    (!coupon.starts_at || new Date(coupon.starts_at) <= now) &&
    (!coupon.ends_at || new Date(coupon.ends_at) >= now);
  const withinUses = coupon && (!coupon.max_uses || coupon.uses_count < coupon.max_uses);
  const eligible =
    coupon?.applies_to_all ||
    coupon?.coupon_products?.some((item: { product_id: string }) => ids.includes(item.product_id));
  if (!coupon || !withinDates || !withinUses || !eligible) return { success: false };
  return { success: true, discountPercent: Number(coupon.discount_percent) };
}

export async function createPublicOrder(input: OrderInput): Promise<OrderResult> {
  try {
    return await createPublicOrderInternal(input);
  } catch (error) {
    console.error("Public order creation failed", error);
    return fail("تعذر إنشاء الطلب حاليًا. حاول مرة أخرى.");
  }
}

async function createPublicOrderInternal(input: OrderInput): Promise<OrderResult> {
  const supabase = await createClient();
  const writer = createServiceClient();
  if (!input.items.length) return fail("أضف منتجًا واحدًا على الأقل.");
  if (input.paymentMethod === "card") return fail("الدفع بالفيزا غير متاح حاليًا.");
  if (input.paymentMethod === "instapay") {
    const number = await getInstapaySettings();
    if (!number) return fail("الدفع عبر Instapay غير مكوّن حاليًا.");
    if (!isValidPaymentProof(input.paymentProof))
      return fail("إثبات الدفع مطلوب بصيغة PNG أو JPG أو WEBP وحجم أقل من 5 ميجابايت.");
  }
  const normalizedName = normalizeCustomerName(input.customerName);
  const normalizedPhone = normalizeEgyptianPhone(input.customerPhone);
  if (!isValidCustomerName(normalizedName))
    return fail("اكتب اسمًا صحيحًا مكوّنًا من حروف عربية أو إنجليزية فقط.");
  if (!isValidEgyptianPhone(input.customerPhone))
    return fail("أدخل رقم هاتف مصري صحيحًا مكوّنًا من 10 أرقام بعد +20.");
  if (
    input.context.type === "table" &&
    (!input.context.qrCode || !input.context.tableId || !input.context.branchId)
  )
    return fail("سياق الطاولة غير صالح.");
  if (
    input.context.type === "delivery" &&
    (!input.deliveryZoneId || !input.deliveryAddress?.trim())
  )
    return fail("بيانات التوصيل مطلوبة.");
  if (input.context.type === "delivery" && !isValidDeliveryAddress(input.deliveryAddress ?? ""))
    return fail("أدخل عنوانًا صحيحًا للتوصيل.");
  if (input.context.type === "delivery" && !isValidLocationUrl(input.deliveryLocationUrl ?? ""))
    return fail("حدد موقع التوصيل من الخريطة قبل إرسال الطلب.");
  const { data: customerProfile } = await writer
    .from("customer_profiles")
    .select("id, order_count")
    .eq("phone", normalizedPhone)
    .maybeSingle();
  const ids = [...new Set(input.items.map((item) => item.productId))];
  const priceIds = [...new Set(input.items.map((item) => item.priceId))];
  if (input.context.type === "table") {
    const { data: qr } = await supabase
      .from("qr_codes")
      .select(
        "id, branch_id, dining_table_id, is_active, dining_tables(table_number, is_active), branches(is_active)",
      )
      .eq("code", input.context.qrCode)
      .eq("type", "table")
      .maybeSingle();
    if (
      !qr ||
      !qr.is_active ||
      qr.branch_id !== input.context.branchId ||
      qr.dining_table_id !== input.context.tableId
    )
      return fail("رمز الطاولة غير صالح أو غير نشط.");
  }
  const [{ data: products }, { data: prices }] = await Promise.all([
    supabase
      .from("products")
      .select("id, availability_status, product_translations(locale,name)")
      .in("id", ids),
    supabase
      .from("product_prices")
      .select("id, product_id, label, price_egp, is_active, valid_until")
      .in("id", priceIds),
  ]);
  if (!products || !prices || products.length !== ids.length)
    return fail("أحد المنتجات لم يعد متاحًا.");
  const productMap = new Map(products.map((product) => [product.id, product]));
  const priceMap = new Map(prices.map((price) => [price.id, price]));
  const now = Date.now();
  let subtotal = 0;
  const items = [];
  for (const item of input.items) {
    const product = productMap.get(item.productId);
    const price = priceMap.get(item.priceId);
    if (
      !product ||
      product.availability_status !== "available" ||
      !price ||
      price.product_id !== item.productId ||
      !price.is_active ||
      (price.valid_until && new Date(price.valid_until).getTime() <= now) ||
      item.quantity < 1 ||
      item.quantity > 99
    )
      return fail("أحد اختيارات السلة لم يعد متاحًا.");
    const availability = await getProductAvailability(item.productId, item.priceId, item.quantity);
    if (!availability.available) return fail("المنتج غير متاح بسبب وصفة أو مخزون غير كافٍ.");
    const line = Number(price.price_egp) * item.quantity;
    subtotal += line;
    items.push({
      product_id: product.id,
      product_price_id: price.id,
      product_name_snapshot: product.product_translations,
      price_label_snapshot: price.label,
      unit_price_egp: price.price_egp,
      quantity: item.quantity,
      line_total_egp: line,
    });
  }
  let deliveryFee = 0;
  if (input.context.type === "delivery") {
    const { data: zone } = await supabase
      .from("delivery_zones")
      .select("delivery_fee_egp")
      .eq("id", input.deliveryZoneId)
      .eq("is_active", true)
      .single();
    if (!zone) return fail("منطقة التوصيل غير متاحة.");
    deliveryFee = customerProfile?.order_count ? 0 : Number(zone.delivery_fee_egp);
  }
  let couponId: string | null = null;
  let couponCode: string | null = null;
  let discount = 0;
  if (input.couponCode?.trim()) {
    couponCode = input.couponCode.trim().toUpperCase();
    const { data: coupon } = await writer
      .from("coupons")
      .select(
        "id, code, discount_percent, applies_to_all, max_uses, uses_count, starts_at, ends_at, coupon_products(product_id)",
      )
      .eq("code", couponCode)
      .eq("is_active", true)
      .maybeSingle();
    const nowDate = new Date();
    const withinDates =
      coupon &&
      (!coupon.starts_at || new Date(coupon.starts_at) <= nowDate) &&
      (!coupon.ends_at || new Date(coupon.ends_at) >= nowDate);
    const withinUses = coupon && (!coupon.max_uses || coupon.uses_count < coupon.max_uses);
    const eligible =
      coupon?.applies_to_all ||
      coupon?.coupon_products?.some((item: { product_id: string }) =>
        ids.includes(item.product_id),
      );
    if (!coupon || !withinDates || !withinUses || !eligible)
      return fail("كود الخصم غير صالح لهذا الطلب.");
    couponId = coupon.id;
    discount = Math.min(
      subtotal,
      Math.round(subtotal * Number(coupon.discount_percent) * 100) / 10000,
    );
  }
  const total = Math.max(0, subtotal + deliveryFee - discount);
  const { data: order, error } = await writer
    .from("orders")
    .insert({
      source: input.source,
      order_type: input.context.type,
      branch_id: input.context.branchId ?? null,
      dining_table_id: input.context.tableId ?? null,
      customer_name: normalizedName,
      customer_phone: normalizedPhone,
      customer_email: input.customerEmail?.trim() || null,
      delivery_zone_id: input.deliveryZoneId ?? null,
      delivery_address: normalizeDeliveryAddress(input.deliveryAddress ?? "") || null,
      delivery_location_url: input.deliveryLocationUrl?.trim() || null,
      customer_notes: input.customerNotes?.trim() || null,
      requested_delivery_time: input.requestedDeliveryTime || null,
      subtotal_egp: subtotal,
      delivery_fee_egp: deliveryFee,
      total_egp: total,
      customer_profile_id: customerProfile?.id ?? null,
      coupon_id: couponId,
      coupon_code: couponCode,
      discount_egp: discount,
      payment_method: input.paymentMethod,
      payment_status: input.paymentMethod === "cash" ? "cash_pending" : "pending",
    })
    .select("id, order_number, status_lookup_token, total_egp")
    .single();
  if (error || !order) return fail("تعذر إنشاء الطلب. حاول مرة أخرى.");
  if (input.paymentMethod === "instapay" && input.paymentProof) {
    const extension =
      input.paymentProof.type === "image/jpeg" ? "jpg" : input.paymentProof.type.split("/")[1];
    const path = `orders/${order.id}/${crypto.randomUUID()}.${extension}`;
    const { error: proofError } = await writer.storage
      .from("payment-proofs")
      .upload(path, input.paymentProof, { contentType: input.paymentProof.type, upsert: false });
    if (proofError) {
      await writer.from("orders").delete().eq("id", order.id);
      return fail("تعذر رفع إثبات الدفع. حاول مرة أخرى.");
    }
    await writer
      .from("orders")
      .update({ payment_status: "proof_submitted", payment_proof_path: path })
      .eq("id", order.id);
    await writer.from("payments").insert({
      order_id: order.id,
      method: "instapay",
      status: "proof_submitted",
      amount_egp: order.total_egp,
      proof_path: path,
    });
  } else {
    await writer.from("payments").insert({
      order_id: order.id,
      method: "cash",
      status: "cash_pending",
      amount_egp: order.total_egp,
    });
  }
  const { error: itemError } = await writer
    .from("order_items")
    .insert(items.map((item) => ({ ...item, order_id: order.id })));
  if (itemError) return fail("تعذر حفظ تفاصيل الطلب.");
  await writer
    .from("order_status_history")
    .insert({ order_id: order.id, to_status: "new", note: "Public order created" });
  await writer.from("audit_logs").insert({
    actor_user_id: null,
    action: "order.created",
    entity_type: "order",
    entity_id: order.id,
    metadata: { source: input.source, order_type: input.context.type },
  });
  if (couponId) {
    await writer.from("coupon_redemptions").insert({
      coupon_id: couponId,
      order_id: order.id,
      customer_phone: normalizedPhone,
      discount_egp: discount,
    });
    await writer.rpc("increment_coupon_uses", { coupon_id_input: couponId });
  }
  await writer.from("customer_profiles").upsert(
    {
      id: customerProfile?.id,
      phone: normalizedPhone,
      name: normalizedName,
      delivery_address: input.deliveryAddress?.trim() || null,
      delivery_location_url: input.deliveryLocationUrl?.trim() || null,
      order_count: (customerProfile?.order_count ?? 0) + 1,
      free_shipping: true,
      first_order_at: customerProfile ? undefined : new Date().toISOString(),
      last_order_at: new Date().toISOString(),
    },
    { onConflict: "phone" },
  );
  await notifyTelegram(
    orderNotification(order.order_number, input.source, "new", {
      customerName: normalizedName,
      customerPhone: normalizedPhone,
      address: input.deliveryAddress,
      location: input.deliveryLocationUrl,
      payment: input.paymentMethod === "cash" ? "الدفع عند الاستلام" : input.paymentMethod,
      total: order.total_egp,
      discount,
    }),
  );
  revalidatePath("/admin/orders");
  return {
    success: true,
    message: "تم استلام طلبك.",
    orderNumber: order.order_number,
    lookupToken: order.status_lookup_token,
  };
}

export async function getInstapaySettings() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "instapay_display_number")
    .eq("is_public", true)
    .maybeSingle();
  const value = data?.value;
  return typeof value === "string"
    ? value
    : typeof value === "object" && value && "number" in value
      ? String((value as { number?: string }).number ?? "")
      : "";
}

export async function saveInstapayNumber(value: string): Promise<OrderResult> {
  const user = await requireRole("owner");
  const supabase = await createClient();
  const number = value.trim();
  if (number.length < 5 || number.length > 80) return fail("أدخل رقم Instapay صالحًا.");
  const { error } = await supabase.from("app_settings").upsert(
    {
      key: "instapay_display_number",
      value: JSON.stringify(number),
      description: "Owner-configured Instapay display number.",
      is_public: true,
    },
    { onConflict: "key" },
  );
  if (error) return fail("تعذر حفظ رقم Instapay.");
  await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    action: "settings.instapay_updated",
    entity_type: "app_setting",
    entity_id: null,
    metadata: { key: "instapay_display_number" },
  });
  revalidatePath("/order");
  revalidatePath("/admin/settings");
  return { success: true, message: "تم حفظ رقم Instapay." };
}

export async function uploadPaymentProof(formData: FormData): Promise<OrderResult> {
  const supabase = await createClient();
  const writer = createServiceClient();
  const orderId = String(formData.get("order_id") ?? "");
  const file = formData.get("proof") as File | null;
  if (
    !orderId ||
    !file ||
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size > 5 * 1024 * 1024
  )
    return fail("الملف غير صالح. استخدم PNG أو JPG أو WEBP بحجم أقل من 5 ميجابايت.");
  const { data: order } = await supabase
    .from("orders")
    .select("id, total_egp, payment_method")
    .eq("id", orderId)
    .maybeSingle();
  if (!order || order.payment_method !== "instapay") return fail("تعذر ربط إثبات الدفع بالطلب.");
  const path = `orders/${order.id}/${crypto.randomUUID()}.${file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1]}`;
  const { error: uploadError } = await writer.storage
    .from("payment-proofs")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return fail("تعذر رفع إثبات الدفع. حاول مرة أخرى.");
  const { error } = await writer.from("payments").insert({
    order_id: order.id,
    method: "instapay",
    status: "proof_submitted",
    amount_egp: order.total_egp,
    proof_path: path,
  });
  if (error) return fail("تعذر حفظ إثبات الدفع.");
  await writer
    .from("orders")
    .update({ payment_status: "proof_submitted", payment_proof_path: path })
    .eq("id", order.id);
  await writer.from("audit_logs").insert({
    actor_user_id: null,
    action: "payment.proof_submitted",
    entity_type: "payment",
    entity_id: order.id,
    metadata: {},
  });
  return { success: true, message: "تم رفع إثبات الدفع." };
}

export async function reviewPayment(
  id: string,
  status: "paid" | "rejected",
  note?: string,
): Promise<OrderResult> {
  const user = await requireRole("owner");
  const supabase = await createClient();
  const { data: payment } = await supabase
    .from("payments")
    .select("id, order_id, proof_path")
    .eq("id", id)
    .maybeSingle();
  if (!payment) return fail("إثبات الدفع غير موجود.");
  const { error } = await supabase
    .from("payments")
    .update({
      status,
      verified_by: user.id,
      verified_at: new Date().toISOString(),
      notes: note || null,
    })
    .eq("id", id);
  if (error) return fail("تعذر تحديث إثبات الدفع.");
  await supabase.from("orders").update({ payment_status: status }).eq("id", payment.order_id);
  await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    action: `payment.${status}`,
    entity_type: "payment",
    entity_id: id,
    metadata: { note: note || null },
  });
  revalidatePath(`/admin/orders/${payment.order_id}`);
  return { success: true, message: status === "paid" ? "تم اعتماد الدفع." : "تم رفض الدفع." };
}

export async function getPaymentProofUrl(paymentId: string) {
  await requireRole("owner");
  const supabase = await createClient();
  const { data } = await supabase
    .from("payments")
    .select("proof_path")
    .eq("id", paymentId)
    .maybeSingle();
  if (!data?.proof_path) return null;
  const { data: signed } = await supabase.storage
    .from("payment-proofs")
    .createSignedUrl(data.proof_path, 300);
  return signed?.signedUrl ?? null;
}

export async function createManualOrder(input: {
  source: "talabat" | "uber" | "whatsapp" | "manual";
  orderType: "delivery" | "external";
  externalReference: string;
  customerName: string;
  customerPhone: string;
  notes: string;
  deliveryZoneId?: string;
  address?: string;
  locationUrl?: string;
  paymentMethod: "cash" | "instapay";
  items: Array<{ productId: string; priceId: string; quantity: number }>;
  paymentProof?: File;
}): Promise<OrderResult> {
  const user = await requireRole("owner");
  const supabase = await createClient();
  const writer = createServiceClient();
  if (!input.items.length) return fail("أضف منتجًا واحدًا على الأقل.");
  if (input.paymentMethod === "instapay" && !isValidPaymentProof(input.paymentProof))
    return fail("إثبات الدفع مطلوب بصيغة PNG أو JPG أو WEBP وحجم أقل من 5 ميجابايت.");
  const ids = [...new Set(input.items.map((item) => item.productId))];
  const priceIds = [...new Set(input.items.map((item) => item.priceId))];
  const [{ data: products }, { data: prices }] = await Promise.all([
    supabase
      .from("products")
      .select("id, availability_status, product_translations(locale,name)")
      .in("id", ids),
    supabase
      .from("product_prices")
      .select("id, product_id, label, price_egp, is_active, valid_until")
      .in("id", priceIds),
  ]);
  if (!products || !prices || products.length !== ids.length)
    return fail("بيانات المنتج غير متاحة.");
  const productMap = new Map(products.map((item) => [item.id, item]));
  const priceMap = new Map(prices.map((item) => [item.id, item]));
  let subtotal = 0;
  const orderItems = [];
  for (const item of input.items) {
    const product = productMap.get(item.productId);
    const price = priceMap.get(item.priceId);
    if (
      !product ||
      product.availability_status !== "available" ||
      !price ||
      price.product_id !== item.productId ||
      !price.is_active ||
      (price.valid_until && new Date(price.valid_until) <= new Date()) ||
      item.quantity < 1
    )
      return fail("أحد المنتجات أو الأسعار لم يعد متاحًا.");
    const line = Number(price.price_egp) * item.quantity;
    subtotal += line;
    orderItems.push({
      product_id: product.id,
      product_price_id: price.id,
      product_name_snapshot: product.product_translations,
      price_label_snapshot: price.label,
      unit_price_egp: price.price_egp,
      quantity: item.quantity,
      line_total_egp: line,
    });
  }
  let fee = 0;
  if (input.orderType === "delivery") {
    if (!input.deliveryZoneId || !input.address?.trim())
      return fail("منطقة التوصيل والعنوان مطلوبان.");
    const { data: zone } = await supabase
      .from("delivery_zones")
      .select("delivery_fee_egp")
      .eq("id", input.deliveryZoneId)
      .eq("is_active", true)
      .single();
    if (!zone) return fail("منطقة التوصيل غير متاحة.");
    fee = Number(zone.delivery_fee_egp);
  }
  const { data: order, error } = await writer
    .from("orders")
    .insert({
      source: input.source,
      order_type: input.orderType,
      customer_name: input.customerName || null,
      customer_phone: input.customerPhone || null,
      customer_notes: [input.externalReference, input.notes].filter(Boolean).join(" · ") || null,
      delivery_zone_id: input.deliveryZoneId || null,
      delivery_address: input.address || null,
      delivery_location_url: input.locationUrl || null,
      subtotal_egp: subtotal,
      delivery_fee_egp: fee,
      total_egp: subtotal + fee,
      payment_method: input.paymentMethod,
      payment_status: input.paymentMethod === "cash" ? "cash_pending" : "pending",
      created_by: user.id,
    })
    .select("id, order_number, status_lookup_token, total_egp")
    .single();
  if (error || !order) return fail("تعذر إنشاء الطلب اليدوي.");
  await writer
    .from("order_items")
    .insert(orderItems.map((item) => ({ ...item, order_id: order.id })));
  if (input.paymentMethod === "instapay" && input.paymentProof) {
    const extension =
      input.paymentProof.type === "image/jpeg" ? "jpg" : input.paymentProof.type.split("/")[1];
    const path = `orders/${order.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await writer.storage
      .from("payment-proofs")
      .upload(path, input.paymentProof, { contentType: input.paymentProof.type, upsert: false });
    if (uploadError) return fail("تعذر رفع إثبات الدفع.");
    await writer
      .from("orders")
      .update({ payment_status: "proof_submitted", payment_proof_path: path })
      .eq("id", order.id);
    await writer.from("payments").insert({
      order_id: order.id,
      method: "instapay",
      status: "proof_submitted",
      amount_egp: order.total_egp,
      proof_path: path,
    });
  } else {
    await writer.from("payments").insert({
      order_id: order.id,
      method: "cash",
      status: "cash_pending",
      amount_egp: order.total_egp,
    });
  }
  await writer.from("order_status_history").insert({
    order_id: order.id,
    to_status: "new",
    changed_by: user.id,
    note: "Manual external order",
  });
  await writer.from("audit_logs").insert({
    actor_user_id: user.id,
    action: "order.manual_created",
    entity_type: "order",
    entity_id: order.id,
    metadata: { source: input.source },
  });
  await notifyTelegram(orderNotification(order.order_number, input.source));
  revalidatePath("/admin/orders");
  return {
    success: true,
    message: "تم إنشاء الطلب اليدوي.",
    orderNumber: order.order_number,
    lookupToken: order.status_lookup_token,
  };
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  note?: string,
): Promise<OrderResult> {
  const user = await requireRole("owner");
  const supabase = await createClient();
  const { data: current } = await supabase
    .from("orders")
    .select("status, order_number, source, total_egp")
    .eq("id", id)
    .single();
  if (!current || !transitions[current.status as OrderStatus].includes(status))
    return fail("انتقال الحالة غير مسموح.");
  if (status === "confirmed") {
    const { data: warehouse } = await supabase
      .from("warehouses")
      .select("id")
      .eq("name", "Home")
      .maybeSingle();
    if (!warehouse) return fail("مستودع Home غير مكوّن.");
    const { error: inventoryError } = await supabase.rpc("consume_order_inventory", {
      order_id_input: id,
      warehouse_id_input: warehouse.id,
    });
    if (inventoryError) return fail("تعذر تأكيد الطلب: الوصفة أو المخزون غير كافٍ.");
  }
  if (status === "cancelled") {
    const { data: consumed } = await supabase
      .from("stock_movements")
      .select("id")
      .eq("reference_type", "order")
      .eq("reference_id", id)
      .eq("movement_type", "consumption")
      .limit(1);
    if (consumed?.length) {
      const { error: restoreError } = await supabase.rpc("restore_cancelled_order", {
        order_id_input: id,
      });
      if (restoreError) return fail("تعذر استعادة مخزون الطلب.");
    }
  }
  const { error } = await supabase
    .from("orders")
    .update({
      status,
      confirmed_by: status === "confirmed" ? user.id : undefined,
      confirmed_at: status === "confirmed" ? new Date().toISOString() : undefined,
    })
    .eq("id", id);
  if (error) return fail("تعذر تحديث حالة الطلب.");
  await supabase.from("order_status_history").insert({
    order_id: id,
    from_status: current.status,
    to_status: status,
    changed_by: user.id,
    note: note || null,
  });
  await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    action: `order.${status}`,
    entity_type: "order",
    entity_id: id,
    metadata: { note: note || null },
  });
  await notifyTelegram(
    orderNotification(current.order_number, current.source as OrderSource, status, {
      total: Number(current.total_egp),
    }),
  );
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  return { success: true, message: "تم تحديث الحالة." };
}

export async function getPublicOrderStatus(orderNumber: string, token: string) {
  const reader = createServiceClient();
  const { data } = await reader
    .from("orders")
    .select(
      "order_number, order_type, status, payment_method, payment_status, created_at, dining_tables(table_number)",
    )
    .eq("order_number", orderNumber)
    .eq("status_lookup_token", token)
    .maybeSingle();
  return data;
}

export async function markPublicOrderDelivered(
  orderNumber: string,
  token: string,
): Promise<OrderResult> {
  const writer = createServiceClient();
  const { data: order } = await writer
    .from("orders")
    .select("id, order_number, source, status, total_egp")
    .eq("order_number", orderNumber)
    .eq("status_lookup_token", token)
    .maybeSingle();
  if (!order || order.status !== "ready")
    return fail("لا يمكن تأكيد الاستلام قبل خروج الطلب للتوصيل.");

  const { error } = await writer
    .from("orders")
    .update({ status: "delivered" })
    .eq("id", order.id)
    .eq("status", "ready");
  if (error) return fail("تعذر تأكيد استلام الطلب.");

  await writer.from("order_status_history").insert({
    order_id: order.id,
    from_status: "ready",
    to_status: "delivered",
    changed_by: null,
    note: "Customer confirmed delivery",
  });
  await writer.from("audit_logs").insert({
    actor_user_id: null,
    action: "order.delivered_by_customer",
    entity_type: "order",
    entity_id: order.id,
    metadata: {},
  });
  await notifyTelegram(
    orderNotification(order.order_number, order.source as OrderSource, "delivered", {
      total: Number(order.total_egp),
    }),
  );
  revalidatePath(`/order/status/${encodeURIComponent(orderNumber)}`);
  revalidatePath("/admin/orders");
  return { success: true, message: "تم تأكيد استلام الطلب." };
}
