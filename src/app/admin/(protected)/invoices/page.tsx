import Link from "next/link";
import { requirePermission } from "@/lib/auth/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getServerLocale } from "@/i18n/server";
import type { Locale } from "@/config/site";

export const dynamic = "force-dynamic";

type InvoiceRow = {
  id: string;
  order_id: string;
  invoice_number: string;
  status: "issued" | "void" | string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_type: "new" | "returning" | string;
  total_egp: number | string;
  currency: string;
  issued_at: string;
};

const copy = {
  ar: {
    eyebrow: "الإدارة المالية",
    title: "الفواتير",
    description: "راجع الفواتير التي تم إنشاؤها تلقائيًا عند تسليم الطلبات.",
    total: "إجمالي الفواتير",
    issued: "صادرة",
    voided: "ملغاة",
    revenue: "إجمالي القيمة",
    invoice: "الفاتورة",
    customer: "العميل",
    type: "نوع العميل",
    amount: "الإجمالي",
    date: "تاريخ الإصدار",
    status: "الحالة",
    newCustomer: "عميل جديد",
    returningCustomer: "عميل عائد",
    issuedStatus: "صادرة",
    voidStatus: "ملغاة",
    order: "الطلب",
    noInvoices: "لا توجد فواتير حتى الآن.",
    setupRequired: "لم يتم تجهيز جدول الفواتير بعد. طبّق migration الفواتير أولًا.",
    retry: "حاول تحديث الصفحة بعد تطبيق الـmigration.",
  },
  en: {
    eyebrow: "Financial administration",
    title: "Invoices",
    description: "Review invoices created automatically when orders are delivered.",
    total: "Total invoices",
    issued: "Issued",
    voided: "Voided",
    revenue: "Total value",
    invoice: "Invoice",
    customer: "Customer",
    type: "Customer type",
    amount: "Total",
    date: "Issued at",
    status: "Status",
    newCustomer: "New customer",
    returningCustomer: "Returning customer",
    issuedStatus: "Issued",
    voidStatus: "Voided",
    order: "Order",
    noInvoices: "No invoices yet.",
    setupRequired: "The invoices table is not ready yet. Apply the invoices migration first.",
    retry: "Refresh this page after applying the migration.",
  },
  it: {
    eyebrow: "Amministrazione finanziaria",
    title: "Fatture",
    description: "Rivedi le fatture create automaticamente quando gli ordini vengono consegnati.",
    total: "Fatture totali",
    issued: "Emesse",
    voided: "Annullate",
    revenue: "Valore totale",
    invoice: "Fattura",
    customer: "Cliente",
    type: "Tipo cliente",
    amount: "Totale",
    date: "Data emissione",
    status: "Stato",
    newCustomer: "Nuovo cliente",
    returningCustomer: "Cliente abituale",
    issuedStatus: "Emessa",
    voidStatus: "Annullata",
    order: "Ordine",
    noInvoices: "Nessuna fattura ancora.",
    setupRequired: "La tabella delle fatture non è ancora pronta. Applica prima la migration.",
    retry: "Aggiorna la pagina dopo aver applicato la migration.",
  },
} as const;

function formatMoney(value: number | string, locale: Locale, currency = "EGP") {
  const numberLocale = locale === "ar" ? "ar-EG" : locale === "it" ? "it-IT" : "en-GB";
  return `${Number(value || 0).toLocaleString(numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

function formatDate(value: string, locale: Locale) {
  const numberLocale = locale === "ar" ? "ar-EG" : locale === "it" ? "it-IT" : "en-GB";
  return new Date(value).toLocaleString(numberLocale, { dateStyle: "medium", timeStyle: "short" });
}

function StatusPill({
  status,
  labels,
}: {
  status: string;
  labels: { issuedStatus: string; voidStatus: string };
}) {
  const isVoid = status === "void";
  return (
    <span
      className={`inline-flex rounded-[var(--radius-pill)] border px-2.5 py-1 text-xs font-semibold ${isVoid ? "border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 text-[var(--color-danger)]" : "border-[var(--color-success)]/30 bg-[var(--color-success)]/10 text-[var(--color-success)]"}`}
    >
      {isVoid ? labels.voidStatus : labels.issuedStatus}
    </span>
  );
}

export default async function InvoicesPage() {
  await requirePermission("invoices.view");
  const locale = await getServerLocale();
  const labels = copy[locale];
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id, order_id, invoice_number, status, customer_name, customer_phone, customer_type, total_egp, currency, issued_at",
    )
    .order("issued_at", { ascending: false })
    .limit(500);
  const invoices = (data ?? []) as InvoiceRow[];
  const issuedCount = invoices.filter((invoice) => invoice.status === "issued").length;
  const voidedCount = invoices.filter((invoice) => invoice.status === "void").length;
  const totalValue = invoices.reduce((sum, invoice) => sum + Number(invoice.total_egp || 0), 0);
  const numberLocale = locale === "ar" ? "ar-EG" : locale;

  return (
    <section className="mx-auto max-w-6xl pb-12">
      <div className="flex flex-wrap items-end justify-between gap-5 border-b border-[var(--color-border)] pb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-brand-primary)]">
            {labels.eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            {labels.title}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--color-text-muted)] sm:text-base">
            {labels.description}
          </p>
        </div>
        <div className="rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2 text-xs font-semibold text-[var(--color-text-muted)]">
          {invoices.length.toLocaleString(numberLocale)}
        </div>
      </div>
      {error ? (
        <div className="mt-8 rounded-[var(--radius-lg)] border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 p-5 text-sm text-[var(--color-text-secondary)]">
          <p className="font-semibold text-[var(--color-text-primary)]">{labels.setupRequired}</p>
          <p className="mt-2 text-[var(--color-text-muted)]">{labels.retry}</p>
        </div>
      ) : null}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [labels.total, invoices.length.toLocaleString(numberLocale)],
          [labels.issued, issuedCount.toLocaleString(numberLocale)],
          [labels.voided, voidedCount.toLocaleString(numberLocale)],
          [labels.revenue, formatMoney(totalValue, locale)],
        ].map(([label, value]) => (
          <div
            className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]"
            key={label}
          >
            <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
            <p className="mt-5 text-2xl font-semibold tracking-[-0.03em]">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-10 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
        {invoices.length === 0 ? (
          <p className="p-6 text-sm text-[var(--color-text-muted)]">{labels.noInvoices}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-[var(--color-background-deep)]/30 text-xs text-[var(--color-text-muted)]">
                <tr>
                  {[
                    labels.invoice,
                    labels.customer,
                    labels.type,
                    labels.amount,
                    labels.date,
                    labels.status,
                  ].map((heading) => (
                    <th
                      className="border-b border-[var(--color-border)] px-4 py-4 text-start font-semibold"
                      key={heading}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr
                    className="border-b border-[var(--color-border)] last:border-0 transition hover:bg-[var(--color-background-deep)]/25"
                    key={invoice.id}
                  >
                    <td className="px-4 py-4">
                      <p className="font-semibold">{invoice.invoice_number}</p>
                      <Link
                        className="mt-1 inline-block text-xs text-[var(--color-brand-primary)] hover:underline"
                        href={`/admin/orders/${invoice.order_id}`}
                      >
                        {labels.order}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <p>{invoice.customer_name || "-"}</p>
                      {invoice.customer_phone ? (
                        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                          {invoice.customer_phone}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 text-[var(--color-text-muted)]">
                      {invoice.customer_type === "returning"
                        ? labels.returningCustomer
                        : labels.newCustomer}
                    </td>
                    <td className="px-4 py-4 font-semibold">
                      {formatMoney(invoice.total_egp, locale, invoice.currency)}
                    </td>
                    <td className="px-4 py-4 text-xs text-[var(--color-text-muted)]">
                      {formatDate(invoice.issued_at, locale)}
                    </td>
                    <td className="px-4 py-4">
                      <StatusPill status={invoice.status} labels={labels} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
