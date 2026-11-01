import Link from "next/link";
import { getPublicOrderStatus } from "@/lib/orders/actions";
import { PageContainer } from "@/components/ui/page-container";
export const dynamic = "force-dynamic";
export default async function OrderStatusPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { orderNumber } = await params;
  const { token } = await searchParams;
  const order = token ? await getPublicOrderStatus(orderNumber, token) : null;
  return (
    <PageContainer>
      <div className="mx-auto max-w-xl rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-[var(--shadow-card)]">
        <h1 className="text-3xl font-semibold">
          {order ? `طلب ${order.order_number}` : "تعذر العثور على الطلب"}
        </h1>
        {order ? (
          <>
            <div className="mt-6 rounded-xl bg-[var(--color-background-deep)] p-4">
              <p className="text-sm text-[var(--color-text-muted)]">الحالة الحالية</p>
              <p className="mt-1 text-2xl font-bold">{order.status}</p>
              <p className="mt-3 text-sm text-[var(--color-text-muted)]">
                الدفع: {order.payment_status} ·{" "}
                {order.order_type === "table"
                  ? `طاولة ${order.dining_tables?.[0]?.table_number ?? ""}`
                  : "توصيل"}
              </p>
            </div>
            <ol className="mt-7 grid gap-3 text-sm">
              <li className="rounded-xl border border-[var(--color-success)] bg-[rgba(94,118,93,0.08)] p-3">
                ✓ تم استلام الطلب
              </li>
              <li className="rounded-xl border border-[var(--color-border)] p-3">
                سيتم تأكيد الطلب وتجهيزه
              </li>
              <li className="rounded-xl border border-[var(--color-border)] p-3">
                جاهز للتوصيل أو الاستلام
              </li>
            </ol>
          </>
        ) : (
          <p className="mt-5 text-[var(--color-text-muted)]">استخدم رابط المتابعة الكامل.</p>
        )}
        <Link className="mt-8 inline-flex underline" href="/menu">
          العودة للقائمة
        </Link>
      </div>
    </PageContainer>
  );
}
