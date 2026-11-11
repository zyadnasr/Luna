import path from "node:path";
import { existsSync } from "node:fs";
import { createServiceClient } from "@/lib/supabase/service";
import type { Locale } from "@/config/site";

export type InvoiceExportItem = {
  product_name_snapshot: Record<string, string> | null;
  price_label_snapshot: string | null;
  unit_price_egp: number | string;
  quantity: number;
  line_total_egp: number | string;
};

export type InvoiceExportData = {
  id: string;
  invoice_number: string;
  status: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  customer_type: string;
  subtotal_egp: number | string;
  delivery_fee_egp: number | string;
  discount_amount_egp: number | string;
  tax_amount_egp: number | string;
  total_egp: number | string;
  currency: string;
  issued_at: string;
  invoice_items: InvoiceExportItem[];
};

export const invoiceExportCopy = {
  ar: {
    title: "فاتورة ضريبية",
    invoice: "الفاتورة",
    issuedAt: "تاريخ الإصدار",
    customer: "العميل",
    phone: "الهاتف",
    address: "العنوان",
    customerType: "نوع العميل",
    newCustomer: "عميل جديد",
    returningCustomer: "عميل عائد",
    item: "المنتج",
    quantity: "الكمية",
    unitPrice: "سعر الوحدة",
    lineTotal: "الإجمالي",
    subtotal: "الإجمالي الفرعي",
    delivery: "رسوم التوصيل",
    discount: "الخصم",
    tax: "الضريبة",
    total: "الإجمالي النهائي",
    issued: "صادرة",
    void: "ملغاة",
    thankYou: "شكرًا لاختيار Luna Healthy",
  },
  en: {
    title: "Invoice",
    invoice: "Invoice",
    issuedAt: "Issued at",
    customer: "Customer",
    phone: "Phone",
    address: "Address",
    customerType: "Customer type",
    newCustomer: "New customer",
    returningCustomer: "Returning customer",
    item: "Item",
    quantity: "Quantity",
    unitPrice: "Unit price",
    lineTotal: "Total",
    subtotal: "Subtotal",
    delivery: "Delivery fee",
    discount: "Discount",
    tax: "Tax",
    total: "Grand total",
    issued: "Issued",
    void: "Voided",
    thankYou: "Thank you for choosing Luna Healthy",
  },
  it: {
    title: "Fattura",
    invoice: "Fattura",
    issuedAt: "Data emissione",
    customer: "Cliente",
    phone: "Telefono",
    address: "Indirizzo",
    customerType: "Tipo cliente",
    newCustomer: "Nuovo cliente",
    returningCustomer: "Cliente abituale",
    item: "Articolo",
    quantity: "Quantità",
    unitPrice: "Prezzo unitario",
    lineTotal: "Totale",
    subtotal: "Subtotale",
    delivery: "Costo consegna",
    discount: "Sconto",
    tax: "Imposta",
    total: "Totale finale",
    issued: "Emessa",
    void: "Annullata",
    thankYou: "Grazie per aver scelto Luna Healthy",
  },
} as const;

export async function getInvoiceExportData(id: string) {
  const db = createServiceClient();
  const { data, error } = await db
    .from("invoices")
    .select("*, invoice_items(*)")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as InvoiceExportData;
}

export function productName(item: InvoiceExportItem, locale: Locale) {
  const snapshot = item.product_name_snapshot ?? {};
  return snapshot[locale] || snapshot.ar || snapshot.en || Object.values(snapshot)[0] || "-";
}

export function formatInvoiceMoney(value: number | string, locale: Locale, currency = "EGP") {
  const numberLocale = locale === "ar" ? "ar-EG" : locale === "it" ? "it-IT" : "en-GB";
  return `${Number(value || 0).toLocaleString(numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

export function formatInvoiceDate(value: string, locale: Locale) {
  const numberLocale = locale === "ar" ? "ar-EG" : locale === "it" ? "it-IT" : "en-GB";
  return new Date(value).toLocaleString(numberLocale, { dateStyle: "medium", timeStyle: "short" });
}

export function invoiceFontPath() {
  const bundledFont = path.join(
    process.cwd(),
    "node_modules",
    "@fontsource",
    "noto-sans-arabic",
    "files",
    "noto-sans-arabic-arabic-400-normal.woff",
  );
  return existsSync(bundledFont) ? bundledFont : null;
}
