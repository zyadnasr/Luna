import { createServiceClient } from "@/lib/supabase/service";
import type { Locale } from "@/config/site";
import { readFileSync } from "node:fs";
import path from "node:path";

export type InvoiceExportItem = {
  product_name_snapshot: Record<string, string> | Array<{ locale: string; name: string }> | null;
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
  order_data_snapshot: Record<string, unknown> | null;
  invoice_items: InvoiceExportItem[];
  orders?: InvoiceOrderDetails | null;
};

export type InvoiceOrderDetails = {
  order_number: string | null;
  order_type: string | null;
  source: string | null;
  status: string | null;
  payment_method: string | null;
  payment_status: string | null;
  delivery_location_url: string | null;
  customer_notes: string | null;
  requested_delivery_time: string | null;
  coupon_code: string | null;
  discount_egp: number | string | null;
  sales_channel: string | null;
  acquisition_source: string | null;
  attribution_type: string | null;
  campaign_ad_set: string | null;
  influencer_partner_name: string | null;
  business_type: string | null;
  invoice_requested: boolean | null;
  invoice_notes: string | null;
  external_invoice_url: string | null;
  external_invoice_error: string | null;
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
    orderDetails: "تفاصيل الطلب",
    orderNumber: "رقم الطلب",
    orderType: "نوع الطلب",
    source: "المصدر",
    orderStatus: "حالة الطلب",
    paymentMethod: "طريقة الدفع",
    paymentStatus: "حالة الدفع",
    salesChannel: "قناة البيع",
    acquisitionSource: "مصدر الاستحواذ",
    attributionType: "نوع الإسناد",
    campaignAdSet: "الحملة / مجموعة الإعلانات",
    influencerPartner: "اسم المؤثر / الشريك",
    businessType: "نوع العميل التجاري",
    customerTypeLabel: "تصنيف العميل",
    customerNotes: "ملاحظات العميل",
    invoiceNotes: "ملاحظات الفاتورة",
    coupon: "كود الخصم",
    requestedDelivery: "موعد التسليم المطلوب",
    deliveryLocation: "رابط الموقع",
    locationLink: "موقع التسليم",
    invoiceRequested: "إصدار فاتورة",
    externalInvoiceUrl: "رابط الفاتورة الخارجي",
    externalInvoiceError: "خطأ الفاتورة الخارجي",
    yes: "نعم",
    no: "لا",
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
    orderDetails: "Order details",
    orderNumber: "Order number",
    orderType: "Order type",
    source: "Source",
    orderStatus: "Order status",
    paymentMethod: "Payment method",
    paymentStatus: "Payment status",
    salesChannel: "Sales channel",
    acquisitionSource: "Acquisition source",
    attributionType: "Attribution type",
    campaignAdSet: "Campaign / ad set",
    influencerPartner: "Influencer / partner",
    businessType: "Business type",
    customerTypeLabel: "Customer classification",
    customerNotes: "Customer notes",
    invoiceNotes: "Invoice notes",
    coupon: "Coupon code",
    requestedDelivery: "Requested delivery",
    deliveryLocation: "Location URL",
    locationLink: "Delivery location",
    invoiceRequested: "Invoice issued",
    externalInvoiceUrl: "External invoice URL",
    externalInvoiceError: "External invoice error",
    yes: "Yes",
    no: "No",
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
    orderDetails: "Dettagli ordine",
    orderNumber: "Numero ordine",
    orderType: "Tipo ordine",
    source: "Fonte",
    orderStatus: "Stato ordine",
    paymentMethod: "Metodo di pagamento",
    paymentStatus: "Stato pagamento",
    salesChannel: "Canale di vendita",
    acquisitionSource: "Fonte acquisizione",
    attributionType: "Tipo attribuzione",
    campaignAdSet: "Campagna / gruppo annunci",
    influencerPartner: "Influencer / partner",
    businessType: "Tipo cliente aziendale",
    customerTypeLabel: "Classificazione cliente",
    customerNotes: "Note cliente",
    invoiceNotes: "Note fattura",
    coupon: "Codice sconto",
    requestedDelivery: "Consegna richiesta",
    deliveryLocation: "URL posizione",
    locationLink: "Posizione consegna",
    invoiceRequested: "Fattura emessa",
    externalInvoiceUrl: "URL fattura esterna",
    externalInvoiceError: "Errore fattura esterna",
    yes: "Sì",
    no: "No",
  },
} as const;

export async function getInvoiceExportData(id: string) {
  const db = createServiceClient();
  const { data, error } = await db
    .from("invoices")
    .select("*, invoice_items(*), orders(*)")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as InvoiceExportData;
}

export function productName(item: InvoiceExportItem, locale: Locale) {
  const snapshot = item.product_name_snapshot ?? {};
  if (Array.isArray(snapshot)) {
    return (
      snapshot.find((translation) => translation.locale === locale)?.name ||
      snapshot.find((translation) => translation.locale === "ar")?.name ||
      snapshot[0]?.name ||
      "-"
    );
  }
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

export function invoiceFontSource(locale: Locale) {
  try {
    const fontPath = path.join(
      process.cwd(),
      "node_modules",
      "@fontsource",
      "noto-sans-arabic",
      "files",
      locale === "ar" ? "noto-sans-arabic-arabic-400-normal.woff" : "noto-sans-arabic-latin-400-normal.woff",
    );
    return readFileSync(fontPath);
  } catch {
    return null;
  }
}
