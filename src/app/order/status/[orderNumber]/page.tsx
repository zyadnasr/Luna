import Link from "next/link";
import { getPublicOrderStatus } from "@/lib/orders/actions";
import { PageContainer } from "@/components/ui/page-container";
import { getServerLocale } from "@/i18n/server";
import { getPublicCopy } from "@/i18n/public";
import { OrderStatusLive, type PublicOrderStatus } from "@/components/orders/order-status-live";
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
      <div className="luna-glass mx-auto max-w-xl rounded-[1.75rem] border p-6 shadow-[var(--shadow-card)] sm:p-8">
        {order ? (
          <OrderStatusLive
            orderNumber={orderNumber}
            token={token ?? ""}
            initialOrder={order as PublicOrderStatus}
          />
        ) : (
          <>
            <h1 className="text-3xl font-semibold">{t.orderNotFound}</h1>
            <p className="mt-5 text-[var(--color-text-muted)]">{t.useFullTrackingLink}</p>
          </>
        )}
        <Link className="mt-8 inline-flex underline" href="/menu">
          {t.menu}
        </Link>
      </div>
    </PageContainer>
  );
}
