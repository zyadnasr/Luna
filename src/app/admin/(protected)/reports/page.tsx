import { requirePermission } from "@/lib/auth/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getServerLocale } from "@/i18n/server";
import { getTranslations } from "@/i18n/translations";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Locale } from "@/config/site";

export const dynamic = "force-dynamic";

const statuses = [
  "new",
  "confirmed",
  "preparing",
  "ready",
  "delivered",
  "rejected",
  "cancelled",
] as const;
type ReportStatus = (typeof statuses)[number];

type OrderRow = {
  order_number: string;
  status: string;
  customer_name: string | null;
  total_egp: number | string;
  created_at: string;
};

type DailySummary = { date: string; total: number; revenue: number } & Record<ReportStatus, number>;

const copy = {
  ar: {
    eyebrow: "التشغيل والتحليل",
    title: "التقارير والجرد",
    description: "ملخص تراكمي للطلبات حسب يوم إنشائها وحالتها الحالية.",
    totalOrders: "إجمالي الطلبات",
    delivered: "تم التسليم",
    rejected: "مرفوضة",
    cancelled: "ملغاة",
    active: "قيد التنفيذ",
    revenue: "إجمالي المبيعات",
    daily: "ملخص يومي",
    dailyDescription: "كل صف يوضح عدد الطلبات التي أُنشئت في اليوم وحالتها الحالية.",
    date: "التاريخ",
    total: "الإجمالي",
    revenueColumn: "المبيعات",
    deliveredOrders: "أرشيف الطلبات المسلّمة",
    deliveredDescription: "الطلبات المسلّمة محفوظة هنا ولا تظهر ضمن قائمة الطلبات النشطة.",
    order: "الطلب",
    customer: "العميل",
    status: "الحالة",
    noOrders: "لا توجد طلبات مسجلة بعد.",
    noDelivered: "لا توجد طلبات مسلّمة بعد.",
  },
  en: {
    eyebrow: "Operations & analytics",
    title: "Reports & ledger",
    description: "A cumulative view of orders by creation date and current status.",
    totalOrders: "Total orders",
    delivered: "Delivered",
    rejected: "Rejected",
    cancelled: "Cancelled",
    active: "In progress",
    revenue: "Total sales",
    daily: "Daily summary",
    dailyDescription: "Each row shows orders created on that day and their current status.",
    date: "Date",
    total: "Total",
    revenueColumn: "Sales",
    deliveredOrders: "Delivered order archive",
    deliveredDescription: "Delivered orders stay here and are removed from the active orders list.",
    order: "Order",
    customer: "Customer",
    status: "Status",
    noOrders: "No orders have been recorded yet.",
    noDelivered: "No delivered orders yet.",
  },
  it: {
    eyebrow: "Operazioni e analisi",
    title: "Report e registro",
    description: "Una vista cumulativa degli ordini per data di creazione e stato attuale.",
    totalOrders: "Ordini totali",
    delivered: "Consegnati",
    rejected: "Rifiutati",
    cancelled: "Annullati",
    active: "In corso",
    revenue: "Vendite totali",
    daily: "Riepilogo giornaliero",
    dailyDescription: "Ogni riga mostra gli ordini creati quel giorno e il loro stato attuale.",
    date: "Data",
    total: "Totale",
    revenueColumn: "Vendite",
    deliveredOrders: "Archivio ordini consegnati",
    deliveredDescription: "Gli ordini consegnati restano qui e vengono rimossi dalla lista attiva.",
    order: "Ordine",
    customer: "Cliente",
    status: "Stato",
    noOrders: "Non sono ancora stati registrati ordini.",
    noDelivered: "Nessun ordine consegnato.",
  },
} as const;

function statusBadge(status: ReportStatus) {
  if (status === "delivered") return "success" as const;
  if (status === "rejected" || status === "cancelled") return "danger" as const;
  if (status === "new") return "warning" as const;
  return "info" as const;
}

function formatDate(value: string, locale: Locale) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(
    locale === "ar" ? "ar-EG" : locale === "it" ? "it-IT" : "en-GB",
    { dateStyle: "medium" },
  );
}

function formatMoney(value: number, locale: Locale) {
  return `${value.toLocaleString(locale === "ar" ? "ar-EG" : locale === "it" ? "it-IT" : "en-GB")} EGP`;
}

export default async function ReportsPage() {
  await requirePermission("reports.view");
  const locale = await getServerLocale();
  const labels = copy[locale];
  const t = getTranslations(locale);
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("orders")
    .select("order_number, status, customer_name, total_egp, created_at")
    .order("created_at", { ascending: false })
    .limit(5000);

  const orders = (data ?? []) as OrderRow[];
  const counts = Object.fromEntries(statuses.map((status) => [status, 0])) as Record<
    ReportStatus,
    number
  >;
  const dailyMap = new Map<string, DailySummary>();
  let totalRevenue = 0;

  for (const order of orders) {
    const status = statuses.includes(order.status as ReportStatus)
      ? (order.status as ReportStatus)
      : "new";
    const amount = Number(order.total_egp) || 0;
    const date = order.created_at.slice(0, 10);
    counts[status] += 1;
    totalRevenue += amount;
    const current =
      dailyMap.get(date) ??
      ({
        date,
        total: 0,
        revenue: 0,
        ...Object.fromEntries(statuses.map((item) => [item, 0])),
      } as DailySummary);
    current.total += 1;
    current.revenue += amount;
    current[status] += 1;
    dailyMap.set(date, current);
  }

  const daily = [...dailyMap.values()].sort((a, b) => b.date.localeCompare(a.date));
  const deliveredOrders = orders.filter((order) => order.status === "delivered");
  const activeOrders = counts.new + counts.confirmed + counts.preparing + counts.ready;
  const numberLocale = locale === "ar" ? "ar-EG" : locale;
  const summary = [
    { label: labels.totalOrders, value: orders.length.toLocaleString(numberLocale) },
    { label: labels.delivered, value: counts.delivered.toLocaleString(numberLocale) },
    { label: labels.rejected, value: counts.rejected.toLocaleString(numberLocale) },
    { label: labels.cancelled, value: counts.cancelled.toLocaleString(numberLocale) },
    { label: labels.active, value: activeOrders.toLocaleString(numberLocale) },
    { label: labels.revenue, value: formatMoney(totalRevenue, locale) },
  ];

  return (
    <section>
      <div className="border-b border-[var(--color-border)] pb-8">
        <p className="text-sm font-semibold text-[var(--color-brand-primary)]">{labels.eyebrow}</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">{labels.title}</h1>
        <p className="mt-4 text-[var(--color-text-muted)]">{labels.description}</p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {summary.map((item) => (
          <div
            className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
            key={item.label}
          >
            <p className="text-sm text-[var(--color-text-muted)]">{item.label}</p>
            <p className="mt-3 text-2xl font-semibold">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="text-2xl font-semibold">{labels.daily}</h2>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">{labels.dailyDescription}</p>
        <div className="mt-5 overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          {daily.length === 0 ? (
            <p className="p-6 text-[var(--color-text-muted)]">{labels.noOrders}</p>
          ) : (
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-4 text-start">{labels.date}</th>
                  <th className="px-4 py-4 text-start">{labels.total}</th>
                  {statuses.map((status) => (
                    <th className="px-4 py-4 text-start" key={status}>
                      {t.orders.status[status]}
                    </th>
                  ))}
                  <th className="px-4 py-4 text-start">{labels.revenueColumn}</th>
                </tr>
              </thead>
              <tbody>
                {daily.map((row) => (
                  <tr className="border-t border-[var(--color-border)]" key={row.date}>
                    <td className="px-4 py-4 font-medium">{formatDate(row.date, locale)}</td>
                    <td className="px-4 py-4">{row.total}</td>
                    {statuses.map((status) => (
                      <td className="px-4 py-4" key={status}>
                        {row[status]}
                      </td>
                    ))}
                    <td className="px-4 py-4">{formatMoney(row.revenue, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-2xl font-semibold">{labels.deliveredOrders}</h2>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">{labels.deliveredDescription}</p>
        <div className="mt-5 overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          {deliveredOrders.length === 0 ? (
            <p className="p-6 text-[var(--color-text-muted)]">{labels.noDelivered}</p>
          ) : (
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr>
                  {[
                    labels.order,
                    labels.customer,
                    labels.status,
                    labels.revenueColumn,
                    labels.date,
                  ].map((heading) => (
                    <th className="px-4 py-4 text-start" key={heading}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deliveredOrders.map((order) => (
                  <tr className="border-t border-[var(--color-border)]" key={order.order_number}>
                    <td className="px-4 py-4 font-semibold">{order.order_number}</td>
                    <td className="px-4 py-4">{order.customer_name ?? "-"}</td>
                    <td className="px-4 py-4">
                      <StatusBadge status={statusBadge("delivered")}>
                        {t.orders.status.delivered}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-4">
                      {formatMoney(Number(order.total_egp) || 0, locale)}
                    </td>
                    <td className="px-4 py-4 text-xs text-[var(--color-text-muted)]">
                      {new Date(order.created_at).toLocaleString(numberLocale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}
