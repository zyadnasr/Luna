import { createServiceClient } from "@/lib/supabase/service";

function phone(value: string | null) {
  return (value ?? "").replace(/\D/g, "");
}

export async function createInvoiceForDeliveredOrder(orderId: string) {
  const db = createServiceClient();
  const { data: order } = await db.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!order || order.status !== "delivered") return { created: false, reason: "not_delivered" } as const;

  const { data: existing } = await db.from("invoices").select("id,invoice_number").eq("order_id", orderId).maybeSingle();
  if (existing) return { created: false, invoiceId: existing.id, invoiceNumber: existing.invoice_number } as const;

  const { data: items } = await db.from("order_items").select("product_id,product_name_snapshot,price_label_snapshot,unit_price_egp,quantity,line_total_egp").eq("order_id", orderId);
  const normalized = phone(order.customer_phone);
  let customerType = "new";
  if (normalized) {
    const { count } = await db.from("orders").select("id", { count: "exact", head: true }).eq("customer_phone", order.customer_phone).eq("status", "delivered").neq("id", orderId);
    customerType = (count ?? 0) > 0 ? "returning" : "new";
  }
  let discountPercentage = 0;
  if (order.coupon_id) {
    const { data: coupon } = await db.from("coupons").select("discount_percent").eq("id", order.coupon_id).maybeSingle();
    discountPercentage = Number(coupon?.discount_percent ?? 0);
  } else if (Number(order.discount_egp) > 0 && Number(order.subtotal_egp) + Number(order.delivery_fee_egp) > 0) {
    discountPercentage = Number(((Number(order.discount_egp) / (Number(order.subtotal_egp) + Number(order.delivery_fee_egp))) * 100).toFixed(2));
  }
  const { data: invoiceNumber, error: numberError } = await db.rpc("next_invoice_number");
  if (numberError || !invoiceNumber) throw numberError ?? new Error("Unable to generate invoice number");
  const { data: invoice, error } = await db.from("invoices").insert({
    order_id: orderId, invoice_number: invoiceNumber, customer_name: order.customer_name, customer_phone: order.customer_phone,
    customer_address: order.delivery_address, customer_type: customerType, subtotal_egp: order.subtotal_egp,
    delivery_fee_egp: order.delivery_fee_egp, discount_percentage: discountPercentage, discount_amount_egp: order.discount_egp ?? 0,
    tax_amount_egp: 0, total_egp: order.total_egp,
  }).select("id,invoice_number").single();
  if (error || !invoice) throw error ?? new Error("Unable to create invoice");
  if (items?.length) {
    const { error: itemsError } = await db.from("invoice_items").insert(items.map((item) => ({ ...item, invoice_id: invoice.id })));
    if (itemsError) throw itemsError;
  }
  return { created: true, invoiceId: invoice.id, invoiceNumber: invoice.invoice_number } as const;
}
