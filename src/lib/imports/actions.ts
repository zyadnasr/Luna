"use server";

import * as XLSX from "xlsx";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { OrderSource } from "@/types/domain";

export type ImportResult = {
  success: boolean;
  message: string;
  importedCount: number;
  failedCount: number;
  batchId?: string;
};

const sourceValues = new Set<OrderSource>([
  "website",
  "qr_table",
  "talabat",
  "uber",
  "whatsapp",
  "manual",
]);
const statusValues = new Set([
  "new",
  "confirmed",
  "preparing",
  "ready",
  "delivered",
  "cancelled",
  "rejected",
]);
const paymentMethodValues = new Set(["cash", "instapay"]);
const paymentStatusValues = new Set([
  "pending",
  "proof_submitted",
  "verified",
  "rejected",
  "cash_pending",
  "paid",
  "refunded",
]);

const aliases = {
  orderNumber: ["order_number", "order number", "order no", "رقم الطلب", "رقم الطلب"],
  source: ["source", "المصدر", "channel", "القناة"],
  status: ["status", "الحالة"],
  customerName: ["customer_name", "customer name", "name", "اسم العميل", "العميل"],
  customerPhone: ["customer_phone", "customer phone", "phone", "الهاتف", "رقم الهاتف"],
  address: ["delivery_address", "address", "العنوان", "عنوان التوصيل"],
  subtotal: ["subtotal_egp", "subtotal", "subtotal egp", "الإجمالي الفرعي"],
  deliveryFee: ["delivery_fee_egp", "delivery fee", "delivery_fee", "رسوم التوصيل"],
  total: ["total_egp", "total", "total egp", "الإجمالي", "المبلغ"],
  paymentMethod: ["payment_method", "payment method", "طريقة الدفع"],
  paymentStatus: ["payment_status", "payment status", "حالة الدفع"],
  createdAt: ["created_at", "created at", "date", "التاريخ", "تاريخ الطلب"],
} as const;

function normalizeKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function cell(row: Record<string, unknown>, keys: readonly string[]) {
  const entries = Object.entries(row);
  const found = entries.find(([key]) =>
    keys.some((alias) => normalizeKey(key) === normalizeKey(alias)),
  );
  return found?.[1] == null ? "" : String(found[1]).trim();
}

function numberValue(value: string, label: string, required = false) {
  if (!value && !required) return 0;
  const parsed = Number(value.replace(/,/g, ""));
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`${label} غير صالح.`);
  return parsed;
}

function enumValue<T extends string>(value: string, allowed: Set<T>, fallback: T, label: string) {
  const normalized = value.toLowerCase();
  if (!value) return fallback;
  if (!allowed.has(normalized as T)) throw new Error(`${label} غير صالح.`);
  return normalized as T;
}

function parseDate(value: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("تاريخ الطلب غير صالح.");
  return date.toISOString();
}

function parseRow(row: Record<string, unknown>) {
  const source = enumValue(cell(row, aliases.source), sourceValues, "manual", "المصدر");
  const status = enumValue(cell(row, aliases.status), statusValues, "new", "الحالة");
  const paymentMethod = enumValue(
    cell(row, aliases.paymentMethod),
    paymentMethodValues,
    "cash",
    "طريقة الدفع",
  );
  const paymentStatus = enumValue(
    cell(row, aliases.paymentStatus),
    paymentStatusValues,
    status === "delivered" ? "paid" : paymentMethod === "cash" ? "cash_pending" : "pending",
    "حالة الدفع",
  );
  const subtotal = numberValue(cell(row, aliases.subtotal), "الإجمالي الفرعي");
  const deliveryFee = numberValue(cell(row, aliases.deliveryFee), "رسوم التوصيل");
  const totalText = cell(row, aliases.total);
  const total = totalText ? numberValue(totalText, "الإجمالي", true) : subtotal + deliveryFee;
  if (total <= 0) throw new Error("الإجمالي مطلوب ويجب أن يكون أكبر من صفر.");

  return {
    order_number: cell(row, aliases.orderNumber) || undefined,
    source,
    order_type: "external" as const,
    status,
    customer_name: cell(row, aliases.customerName) || null,
    customer_phone: cell(row, aliases.customerPhone) || null,
    delivery_address: cell(row, aliases.address) || null,
    subtotal_egp: subtotal || total - deliveryFee,
    delivery_fee_egp: deliveryFee,
    total_egp: total,
    payment_method: paymentMethod,
    payment_status: paymentStatus,
    created_at: parseDate(cell(row, aliases.createdAt)),
  };
}

export async function importOrdersFromExcel(
  _previous: ImportResult | null,
  formData: FormData,
): Promise<ImportResult> {
  const user = await requirePermission("invoices.view");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, message: "اختر ملف Excel أولًا.", importedCount: 0, failedCount: 0 };
  }
  if (file.size > 10 * 1024 * 1024) {
    return {
      success: false,
      message: "حجم الملف يجب ألا يتجاوز 10 ميجابايت.",
      importedCount: 0,
      failedCount: 0,
    };
  }

  const db = createServiceClient();
  let rows: Record<string, unknown>[];
  try {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!firstSheet) throw new Error("الملف لا يحتوي على ورقة بيانات.");
    rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
      defval: "",
      raw: false,
    });
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "تعذر قراءة ملف Excel.",
      importedCount: 0,
      failedCount: 0,
    };
  }
  if (rows.length === 0)
    return { success: false, message: "ورقة Excel فارغة.", importedCount: 0, failedCount: 0 };
  if (rows.length > 5000)
    return {
      success: false,
      message: "الحد الأقصى للاستيراد هو 5000 صف في المرة الواحدة.",
      importedCount: 0,
      failedCount: 0,
    };

  const { data: batch, error: batchError } = await db
    .from("order_import_batches")
    .insert({ file_name: file.name.slice(0, 255), imported_by: user.id, status: "processing" })
    .select("id")
    .single();
  if (batchError || !batch) {
    return {
      success: false,
      message: "تعذر بدء عملية الاستيراد. تأكد من تطبيق Migration الاستيراد.",
      importedCount: 0,
      failedCount: 0,
    };
  }

  let importedCount = 0;
  let failedCount = 0;
  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2;
    try {
      const parsed = parseRow(row);
      const { data: order, error: orderError } = await db
        .from("orders")
        .insert({ ...parsed, created_by: user.id })
        .select("id")
        .single();
      if (orderError || !order) throw new Error(orderError?.message || "تعذر إنشاء الطلب.");
      await db
        .from("payments")
        .insert({
          order_id: order.id,
          method: parsed.payment_method,
          status: parsed.payment_status,
          amount_egp: parsed.total_egp,
        });
      await db
        .from("order_status_history")
        .insert({
          order_id: order.id,
          to_status: parsed.status,
          changed_by: user.id,
          note: `Imported from ${file.name}`,
        });
      importedCount += 1;
    } catch (error) {
      failedCount += 1;
      await db
        .from("order_import_errors")
        .insert({
          batch_id: batch.id,
          row_number: rowNumber,
          order_number: cell(row, aliases.orderNumber) || null,
          error: error instanceof Error ? error.message : "تعذر استيراد الصف.",
          raw_row: row,
        });
    }
  }

  await db
    .from("order_import_batches")
    .update({
      imported_count: importedCount,
      failed_count: failedCount,
      status: importedCount > 0 ? "completed" : "failed",
    })
    .eq("id", batch.id);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/invoices/import");
  return {
    success: importedCount > 0,
    message:
      importedCount > 0
        ? "اكتمل الاستيراد مع تسجيل الصفوف التي بها أخطاء."
        : "فشل استيراد كل الصفوف.",
    importedCount,
    failedCount,
    batchId: batch.id,
  };
}
