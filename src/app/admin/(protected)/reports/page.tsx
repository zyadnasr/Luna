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

type SummaryTone = "neutral" | "success" | "danger" | "warning" | "revenue";

function SummaryIcon({ tone }: { tone: SummaryTone }) {
  const color =
    tone === "success"
      ? "var(--color-success)"
      : tone === "danger"
        ? "var(--color-danger)"
        : tone === "warning" || tone === "revenue"
          ? "var(--color-warning)"
          : "var(--color-text-muted)";
  return (
    <span
      className="grid size-9 place-items-center rounded-full border border-[var(--color-border)] bg-[var(--color-background-deep)]/40"
      style={{ color }}
      aria-hidden="true"
    >
      <svg
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
      >
        {tone === "success" ? (
          <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
        ) : tone === "danger" ? (
          <path d="m8 8 8 8M16 8l-8 8" strokeLinecap="round" />
        ) : tone === "warning" ? (
          <path d="M12 7v5m0 4h.01M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" strokeLinecap="round" />
        ) : tone === "revenue" ? (
          <path d="M4 7h16v10H4zM8 7V5h8v2m-6 5h4" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M6 5h12v14H6zM9 9h6m-6 4h6m-6 4h3" strokeLinecap="round" />
        )}
      </svg>
    </span>
  );
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
  const summary: { label: string; value: string; tone: SummaryTone }[] = [
    {
      label: labels.totalOrders,
      value: orders.length.toLocaleString(numberLocale),
      tone: "neutral",
    },
    {
      label: labels.delivered,
      value: counts.delivered.toLocaleString(numberLocale),
      tone: "success",
    },
    { label: labels.rejected, value: counts.rejected.toLocaleString(numberLocale), tone: "danger" },
    {
      label: labels.cancelled,
      value: counts.cancelled.toLocaleString(numberLocale),
      tone: "neutral",
    },
    { label: labels.active, value: activeOrders.toLocaleString(numberLocale), tone: "warning" },
    { label: labels.revenue, value: formatMoney(totalRevenue, locale), tone: "revenue" },
  ];

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
        <div className="flex items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2 text-xs font-semibold text-[var(--color-text-muted)]">
          <span className="size-1.5 rounded-full bg-[var(--color-success)]" aria-hidden="true" />
          {orders.length.toLocaleString(numberLocale)}
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {summary.map((item) => (
          <div
            className={`group rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] ${item.tone === "revenue" ? "xl:col-span-1" : ""}`}
            key={item.label}
          >
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm text-[var(--color-text-muted)] transition group-hover:text-[var(--color-text-primary)]">
                {item.label}
              </p>
              <SummaryIcon tone={item.tone} />
            </div>
            <p
              className={`mt-5 font-semibold tracking-[-0.03em] ${item.tone === "revenue" ? "text-3xl" : "text-2xl"}`}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <section className="mt-12">
        <div className="mb-5">
          <h2 className="text-xl font-semibold tracking-[-0.025em]">{labels.daily}</h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">{labels.dailyDescription}</p>
        </div>
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
          {daily.length === 0 ? (
            <p className="p-6 text-[var(--color-text-muted)]">{labels.noOrders}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="bg-[var(--color-background-deep)]/30 text-xs text-[var(--color-text-muted)]">
                  <tr>
                    <th className="border-b border-[var(--color-border)] px-4 py-4 text-start font-semibold">
                      {labels.date}
                    </th>
                    <th className="border-b border-[var(--color-border)] px-4 py-4 text-start font-semibold">
                      {labels.total}
                    </th>
                    {statuses.map((status) => (
                      <th
                        className="border-b border-[var(--color-border)] px-4 py-4 text-start font-semibold"
                        key={status}
                      >
                        {t.orders.status[status]}
                      </th>
                    ))}
                    <th className="border-b border-[var(--color-border)] px-4 py-4 text-start font-semibold">
                      {labels.revenueColumn}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {daily.map((row) => (
                    <tr
                      className="border-b border-[var(--color-border)] last:border-0 transition hover:bg-[var(--color-background-deep)]/25"
                      key={row.date}
                    >
                      <td className="px-4 py-4 font-medium">{formatDate(row.date, locale)}</td>
                      <td className="px-4 py-4">{row.total}</td>
                      {statuses.map((status) => (
                        <td className="px-4 py-4 text-[var(--color-text-muted)]" key={status}>
                          {row[status]}
                        </td>
                      ))}
                      <td className="px-4 py-4 font-semibold">
                        {formatMoney(row.revenue, locale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="mt-12">
        <div className="mb-5">
          <h2 className="text-xl font-semibold tracking-[-0.025em]">{labels.deliveredOrders}</h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            {labels.deliveredDescription}
          </p>
        </div>
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
          {deliveredOrders.length === 0 ? (
            <p className="p-6 text-[var(--color-text-muted)]">{labels.noDelivered}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-sm">
                <thead className="bg-[var(--color-background-deep)]/30 text-xs text-[var(--color-text-muted)]">
                  <tr>
                    {[
                      labels.order,
                      labels.customer,
                      labels.status,
                      labels.revenueColumn,
                      labels.date,
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
                  {deliveredOrders.map((order) => (
                    <tr
                      className="border-b border-[var(--color-border)] last:border-0 transition hover:bg-[var(--color-background-deep)]/25"
                      key={order.order_number}
                    >
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
            </div>
          )}
        </div>
      </section>
    </section>
  );
}
