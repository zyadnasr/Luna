import Link from "next/link";
import { getPublicOrderStatus } from "@/lib/orders/actions";
import { PageContainer } from "@/components/ui/page-container";
import { getServerLocale } from "@/i18n/server";
import { getPublicCopy } from "@/i18n/public";
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
  const t = getPublicCopy(await getServerLocale());
  const order = token ? await getPublicOrderStatus(orderNumber, token) : null;
  return (
    <PageContainer>
      <div className="mx-auto max-w-xl rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-[var(--shadow-card)]">
        <h1 className="text-3xl font-semibold">
          {order ? `${t.order} ${order.order_number}` : t.orderNotFound}
        </h1>
        {order ? (
          <>
            <div className="mt-6 rounded-xl bg-[var(--color-background-deep)] p-4">
              <p className="text-sm text-[var(--color-text-muted)]">{t.pendingReview}</p>
              <p className="mt-1 text-2xl font-bold">
                {({ new: t.pendingReview, confirmed: t.confirmed, preparing: t.preparing, ready: t.ready, delivered: t.delivered, cancelled: t.cancelled, rejected: t.rejected } as Record<string, string>)[order.status] ?? order.status}
              </p>
              <p className="mt-3 text-sm text-[var(--color-text-muted)]">
                {t.payment}: {order.payment_method === "cash" ? t.paymentCash : order.payment_status} ·{" "}
                {order.order_type === "table"
                  ? `${t.order} ${order.dining_tables?.[0]?.table_number ?? ""}`
                  : t.deliveryOrder}
              </p>
            </div>
            <ol className="mt-7 grid gap-3 text-sm">
              <li className="rounded-xl border border-[var(--color-success)] bg-[rgba(94,118,93,0.08)] p-3">
                ✓ {t.received}
              </li>
              <li className="rounded-xl border border-[var(--color-border)] p-3">
                {t.confirmed}
              </li>
              <li className="rounded-xl border border-[var(--color-border)] p-3">
                {t.contactCourier}
              </li>
            </ol>
          </>
        ) : (
          <p className="mt-5 text-[var(--color-text-muted)]">{t.useFullTrackingLink}</p>
        )}
        <Link className="mt-8 inline-flex underline" href="/menu">
          {t.menu}
        </Link>
      </div>
    </PageContainer>
  );
}
