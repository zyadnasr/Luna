import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getServerLocale } from "@/i18n/server";
import type { Locale } from "@/config/site";

export const dynamic = "force-dynamic";

const copy = {
  ar: {
    eyebrow: "تفاصيل الفاتورة",
    back: "العودة إلى الفواتير",
    customer: "بيانات العميل",
    name: "الاسم",
    phone: "الهاتف",
    address: "العنوان",
    customerType: "تصنيف العميل",
    newCustomer: "عميل جديد",
    returningCustomer: "عميل عائد",
    orders: "كل طلبات العميل",
    ordersCount: "عدد الطلبات",
    totalSpent: "إجمالي الإنفاق",
    order: "الطلب",
    status: "الحالة",
    source: "المصدر",
    payment: "الدفع",
    paymentStatus: "حالة الدفع",
    amount: "الإجمالي",
    created: "التاريخ",
    notes: "الملاحظات",
    products: "المنتجات",
    noOrders: "لا توجد طلبات أخرى لهذا العميل.",
    invoice: "الفاتورة",
    issued: "تاريخ الإصدار",
    pdf: "تحميل PDF",
    word: "تحميل Word",
    orderDetails: "بيانات الطلب الكاملة",
    delivery: "عنوان التسليم",
    deliveryTime: "موعد التسليم المطلوب",
    salesChannel: "قناة البيع",
    acquisitionSource: "مصدر الاستحواذ",
    attributionType: "نوع الإسناد",
    businessType: "نوع العميل التجاري",
    coupon: "كود الخصم",
    discount: "قيمة الخصم",
    campaign: "الحملة الإعلانية",
    medium: "وسيط الإعلان",
    referrer: "صفحة الإحالة",
    clickIds: "معرّفات الإعلان",
    yes: "نعم",
    no: "لا",
  },
  en: {
    eyebrow: "Invoice details",
    back: "Back to invoices",
    customer: "Customer profile",
    name: "Name",
    phone: "Phone",
    address: "Address",
    customerType: "Customer type",
    newCustomer: "New customer",
    returningCustomer: "Returning customer",
    orders: "All customer orders",
    ordersCount: "Orders",
    totalSpent: "Total spent",
    order: "Order",
    status: "Status",
    source: "Source",
    payment: "Payment",
    paymentStatus: "Payment status",
    amount: "Total",
    created: "Date",
    notes: "Notes",
    products: "Products",
    noOrders: "No other orders found for this customer.",
    invoice: "Invoice",
    issued: "Issued at",
    pdf: "Download PDF",
    word: "Download Word",
    orderDetails: "Complete order data",
    delivery: "Delivery address",
    deliveryTime: "Requested delivery",
    salesChannel: "Sales channel",
    acquisitionSource: "Acquisition source",
    attributionType: "Attribution type",
    businessType: "Business type",
    coupon: "Coupon code",
    discount: "Discount amount",
    campaign: "Ad campaign",
    medium: "Ad medium",
    referrer: "Referrer",
    clickIds: "Ad click IDs",
    yes: "Yes",
    no: "No",
  },
  it: {
    eyebrow: "Dettagli fattura",
    back: "Torna alle fatture",
    customer: "Profilo cliente",
    name: "Nome",
    phone: "Telefono",
    address: "Indirizzo",
    customerType: "Tipo cliente",
    newCustomer: "Nuovo cliente",
    returningCustomer: "Cliente abituale",
    orders: "Tutti gli ordini del cliente",
    ordersCount: "Ordini",
    totalSpent: "Totale speso",
    order: "Ordine",
    status: "Stato",
    source: "Fonte",
    payment: "Pagamento",
    paymentStatus: "Stato pagamento",
    amount: "Totale",
    created: "Data",
    notes: "Note",
    products: "Prodotti",
    noOrders: "Nessun altro ordine trovato per questo cliente.",
    invoice: "Fattura",
    issued: "Data emissione",
    pdf: "Scarica PDF",
    word: "Scarica Word",
    orderDetails: "Dati completi ordine",
    delivery: "Indirizzo consegna",
    deliveryTime: "Consegna richiesta",
    salesChannel: "Canale di vendita",
    acquisitionSource: "Fonte acquisizione",
    attributionType: "Tipo attribuzione",
    businessType: "Tipo cliente aziendale",
    coupon: "Codice sconto",
    discount: "Importo sconto",
    campaign: "Campagna pubblicitaria",
    medium: "Mezzo pubblicitario",
    referrer: "Referrer",
    clickIds: "ID clic annuncio",
    yes: "Sì",
    no: "No",
  },
} as const;

type Order = {
  id: string;
  order_number: string;
  status: string;
  source: string | null;
  order_type: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  delivery_address: string | null;
  customer_notes: string | null;
  payment_method: string | null;
  payment_status: string | null;
  total_egp: number | string;
  created_at: string;
  requested_delivery_time: string | null;
  sales_channel: string | null;
  acquisition_source: string | null;
  attribution_type: string | null;
  business_type: string | null;
  coupon_code: string | null;
  discount_egp: number | string | null;
  attribution_source: string | null;
  attribution_utm_campaign: string | null;
  attribution_utm_medium: string | null;
  attribution_referrer: string | null;
  attribution_gclid: string | null;
  attribution_fbclid: string | null;
  invoice_requested: boolean | null;
  order_items: Array<{
    id: string;
    product_name_snapshot: Record<string, string> | null;
    price_label_snapshot: string | null;
    quantity: number;
    line_total_egp: number | string;
  }>;
};

function money(value: number | string, locale: Locale, currency = "EGP") {
  const numberLocale = locale === "ar" ? "ar-EG" : locale === "it" ? "it-IT" : "en-GB";
  return `${Number(value || 0).toLocaleString(numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

function date(value: string, locale: Locale) {
  const numberLocale = locale === "ar" ? "ar-EG" : locale === "it" ? "it-IT" : "en-GB";
  return new Date(value).toLocaleString(numberLocale, { dateStyle: "medium", timeStyle: "short" });
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="border-b border-[var(--color-border)] py-3 last:border-0">
      <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 break-words text-sm font-medium">{value || "-"}</p>
    </div>
  );
}

export default async function InvoiceDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("invoices.view");
  const { id } = await params;
  const locale = await getServerLocale();
  const labels = copy[locale];
  const db = createServiceClient();
  const { data: invoice } = await db
    .from("invoices")
    .select("*, invoice_items(*), orders(*)")
    .eq("id", id)
    .maybeSingle();
  if (!invoice) notFound();

  const currentOrder = invoice.orders as Order | null;
  const phone = invoice.customer_phone || currentOrder?.customer_phone;
  const { data: customerOrders } = phone
    ? await db.from("orders").select("*").eq("customer_phone", phone).order("created_at", { ascending: false })
    : currentOrder
      ? await db.from("orders").select("*").eq("id", currentOrder.id)
      : { data: [] };
  const orders = (customerOrders ?? []) as Order[];
  const totalSpent = orders.reduce((sum, order) => sum + Number(order.total_egp || 0), 0);

  return (
    <section className="mx-auto max-w-6xl space-y-6 pb-12">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--color-border)] pb-6">
        <div>
          <Link href="/admin/invoices" className="text-sm text-[var(--color-brand-primary)] hover:underline">← {labels.back}</Link>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-brand-primary)]">{labels.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{invoice.invoice_number}</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">{labels.issued}: {date(invoice.issued_at, locale)}</p>
        </div>
        <div className="flex gap-2">
          <a className="rounded-[var(--radius-pill)] border border-[var(--color-border)] px-3 py-2 text-sm hover:border-[var(--color-brand-primary)]" download href={`/api/admin/invoices/${invoice.id}/pdf`}>{labels.pdf}</a>
          <a className="rounded-[var(--radius-pill)] border border-[var(--color-border)] px-3 py-2 text-sm hover:border-[var(--color-brand-primary)]" download href={`/api/admin/invoices/${invoice.id}/word`}>{labels.word}</a>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <article className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
          <h2 className="text-xl font-bold">{labels.customer}</h2>
          <div className="mt-4">
            <Field label={labels.name} value={invoice.customer_name} />
            <Field label={labels.phone} value={invoice.customer_phone} />
            <Field label={labels.address} value={invoice.customer_address} />
            <Field label={labels.customerType} value={invoice.customer_type === "returning" ? labels.returningCustomer : labels.newCustomer} />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-[var(--radius-md)] bg-[var(--color-background-deep)]/40 p-4"><p className="text-xs text-[var(--color-text-muted)]">{labels.ordersCount}</p><p className="mt-2 text-2xl font-bold">{orders.length}</p></div>
            <div className="rounded-[var(--radius-md)] bg-[var(--color-background-deep)]/40 p-4"><p className="text-xs text-[var(--color-text-muted)]">{labels.totalSpent}</p><p className="mt-2 text-lg font-bold">{money(totalSpent, locale, invoice.currency)}</p></div>
          </div>
        </article>

        <article className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
          <h2 className="text-xl font-bold">{labels.invoice}</h2>
          <div className="mt-4 grid gap-x-6 sm:grid-cols-2">
            <Field label={labels.amount} value={money(invoice.total_egp, locale, invoice.currency)} />
            <Field label={labels.status} value={invoice.status} />
            <Field label={labels.created} value={date(invoice.issued_at, locale)} />
            <Field label={labels.order} value={currentOrder?.order_number} />
          </div>
        </article>
      </div>

      <article className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
        <h2 className="text-xl font-bold">{labels.orders}</h2>
        {orders.length === 0 ? <p className="mt-4 text-sm text-[var(--color-text-muted)]">{labels.noOrders}</p> : (
          <div className="mt-5 space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><Link href={`/admin/orders/${order.id}`} className="font-bold text-[var(--color-brand-primary)] hover:underline">{labels.order} #{order.order_number}</Link><p className="mt-1 text-xs text-[var(--color-text-muted)]">{date(order.created_at, locale)}</p></div>
                  <p className="text-lg font-bold">{money(order.total_egp, locale, invoice.currency)}</p>
                </div>
                <div className="mt-4 grid gap-x-6 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label={labels.status} value={order.status} />
                  <Field label={labels.source} value={order.source} />
                  <Field label={labels.payment} value={order.payment_method} />
                  <Field label={labels.paymentStatus} value={order.payment_status} />
                  <Field label={labels.delivery} value={order.delivery_address} />
                  <Field label={labels.deliveryTime} value={order.requested_delivery_time ? date(order.requested_delivery_time, locale) : null} />
                  <Field label={labels.salesChannel} value={order.sales_channel} />
                  <Field label={labels.acquisitionSource} value={order.acquisition_source || order.attribution_source} />
                  <Field label={labels.attributionType} value={order.attribution_type} />
                  <Field label={labels.campaign} value={order.attribution_utm_campaign} />
                  <Field label={labels.medium} value={order.attribution_utm_medium} />
                  <Field label={labels.referrer} value={order.attribution_referrer} />
                  <Field
                    label={labels.clickIds}
                    value={[order.attribution_gclid && `gclid: ${order.attribution_gclid}`, order.attribution_fbclid && `fbclid: ${order.attribution_fbclid}`].filter(Boolean).join(" · ")}
                  />
                  <Field label={labels.businessType} value={order.business_type} />
                  <Field label={labels.coupon} value={order.coupon_code} />
                  <Field label={labels.discount} value={money(order.discount_egp ?? 0, locale, invoice.currency)} />
                  <Field label={labels.notes} value={order.customer_notes} />
                </div>
                <div className="mt-4 border-t border-[var(--color-border)] pt-3"><p className="text-xs text-[var(--color-text-muted)]">{labels.products}</p><div className="mt-2 space-y-1 text-sm">{(order.order_items ?? []).map((item) => <div className="flex justify-between gap-3" key={item.id}><span>{item.price_label_snapshot || (item.product_name_snapshot && Object.values(item.product_name_snapshot)[0]) || "-"} × {item.quantity}</span><span className="font-semibold">{money(item.line_total_egp, locale, invoice.currency)}</span></div>)}</div></div>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}
