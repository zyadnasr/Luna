import Link from "next/link";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { getServerLocale } from "@/i18n/server";
import { translateAdminText } from "@/i18n/admin-text";

export const dynamic = "force-dynamic";
export default async function OrdersPage() {
  await requireRole("owner");
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, order_number, source, order_type, status, customer_name, customer_phone, total_egp, payment_status, created_at, dining_tables(table_number)",
    )
    .order("created_at", { ascending: false })
    .limit(50);
  const locale = await getServerLocale();
  const t = (value: string) => translateAdminText(locale, value);
  return (
    <section>
      <div className="flex items-end justify-between gap-5 border-b border-[var(--color-border)] pb-8">
        <div>
          <p className="text-sm font-semibold text-[var(--color-brand-primary)]">{t("التشغيل")}</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">{t("الطلبات")}</h1>
          <p className="mt-4 text-[var(--color-text-muted)]">
            {t("عرض ومتابعة الطلبات الحقيقية فقط.")}
          </p>
        </div>
        <Link
          className="inline-flex min-h-11 items-center rounded-[var(--radius-pill)] bg-[var(--color-brand-secondary)] px-5 text-sm font-semibold text-[var(--color-on-brand)]"
          href="/admin/orders/new"
        >
          {t("طلب يدوي")}
        </Link>
      </div>
      {!orders?.length ? (
        <div className="mt-8">
          <EmptyState
            title={t("لا توجد طلبات بعد")}
            description={t(
              "ستظهر هنا الطلبات العامة وطلبات الطاولات والطلبات اليدوية بعد إرسالها.",
            )}
          />
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr>
                {["الطلب", "المصدر", "النوع", "الحالة", "العميل", "الإجمالي", "التاريخ"].map(
                  (heading) => (
                    <th className="px-4 py-4 text-start" key={heading}>
                      {t(heading)}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr className="border-t border-[var(--color-border)]" key={order.id}>
                  <td className="px-4 py-4">
                    <Link className="font-semibold underline" href={`/admin/orders/${order.id}`}>
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="px-4 py-4">{t(order.source)}</td>
                  <td className="px-4 py-4">{t(order.order_type)}</td>
                  <td className="px-4 py-4">
                    <StatusBadge
                      status={
                        order.status === "new"
                          ? "warning"
                          : order.status === "rejected" || order.status === "cancelled"
                            ? "danger"
                            : "info"
                      }
                    >
                      {t(order.status)}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-4">{order.customer_name ?? "-"}</td>
                  <td className="px-4 py-4">
                    {Number(order.total_egp).toLocaleString("ar-EG")} ج.م
                  </td>
                  <td className="px-4 py-4 text-xs text-[var(--color-text-muted)]">
                    {new Date(order.created_at).toLocaleString("ar-EG")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
