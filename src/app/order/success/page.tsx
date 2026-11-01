import Link from "next/link";
import { PageContainer } from "@/components/ui/page-container";
export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ number?: string; token?: string }>;
}) {
  const params = await searchParams;
  return (
    <PageContainer>
      <div className="mx-auto max-w-xl rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 text-center shadow-[var(--shadow-elevated)]">
        <p className="text-sm font-semibold text-[var(--color-success)]">تم استلام الطلب</p>
        <h1 className="mt-4 text-4xl font-semibold">شكرًا لك.</h1>
        <p className="mt-4 text-[var(--color-text-muted)]">
          رقم الطلب: <strong>{params.number ?? "غير متاح"}</strong>
        </p>
        {params.number && params.token ? (
          <Link
            className="mt-8 inline-flex min-h-11 items-center rounded-[var(--radius-pill)] bg-[var(--color-brand-secondary)] px-5 text-sm font-semibold text-[var(--color-on-brand)]"
            href={`/order/status/${encodeURIComponent(params.number)}?token=${encodeURIComponent(params.token)}`}
          >
            متابعة حالة الطلب
          </Link>
        ) : null}
        <Link
          className="mt-3 inline-flex min-h-11 items-center rounded-full border border-[var(--color-border-strong)] px-5 text-sm font-semibold"
          href="/menu"
        >
          العودة إلى المنيو
        </Link>
      </div>
    </PageContainer>
  );
}
