import Link from "next/link";
import { PageContainer } from "@/components/ui/page-container";
import { getServerLocale } from "@/i18n/server";
import { getPublicCopy } from "@/i18n/public";
export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ number?: string; token?: string }>;
}) {
  const params = await searchParams;
  const t = getPublicCopy(await getServerLocale());
  return (
    <PageContainer>
      <div className="mx-auto max-w-xl rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 text-center shadow-[var(--shadow-elevated)]">
        <p className="text-sm font-semibold text-[var(--color-success)]">{t.received}</p>
        <h1 className="mt-4 text-4xl font-semibold">{t.trackingHint}</h1>
        <p className="mt-4 text-[var(--color-text-muted)]">
          {t.order}: <strong>{params.number ?? "—"}</strong>
        </p>
        {params.number && params.token ? (
          <Link
            className="mt-8 inline-flex min-h-11 items-center rounded-[var(--radius-pill)] bg-[var(--color-brand-secondary)] px-5 text-sm font-semibold text-[var(--color-on-brand)]"
            href={`/order/status/${encodeURIComponent(params.number)}?token=${encodeURIComponent(params.token)}`}
          >
            {t.continueOrder}
          </Link>
        ) : null}
        <Link
          className="mt-3 inline-flex min-h-11 items-center rounded-full border border-[var(--color-border-strong)] px-5 text-sm font-semibold"
          href="/menu"
        >
          {t.menu}
        </Link>
      </div>
    </PageContainer>
  );
}
