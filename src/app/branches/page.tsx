import Link from "next/link";
import Image from "next/image";
import { PageContainer } from "@/components/ui/page-container";
import { getServerLocale } from "@/i18n/server";
import { getPublicCopy } from "@/i18n/public";
import { getBranches } from "@/lib/site/branches";

export const dynamic = "force-dynamic";

export default async function BranchesPage() {
  const locale = await getServerLocale();
  const t = getPublicCopy(locale);
  const branches = await getBranches();
  return (
    <PageContainer>
      <header className="max-w-2xl border-b border-[var(--color-border)] pb-8">
        <Link href="/" className="text-sm font-semibold text-[var(--color-brand-primary)]">← {t.backHome}</Link>
        <p className="mt-10 text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-brand-primary)]">{t.branchesEyebrow}</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">{t.branchesTitle}</h1>
        <p className="mt-4 text-base leading-8 text-[var(--color-text-muted)]">{t.branchesDescription}</p>
      </header>
      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {branches.length ? branches.map((branch) => (
          <article key={branch.id} className="luna-glass rounded-[var(--radius-lg)] border border-[var(--color-border)] p-6 sm:p-7">
            {branch.image_url ? <div className="relative mb-6 aspect-[16/9] overflow-hidden rounded-[var(--radius-md)]"><Image src={branch.image_url} alt={branch.name} fill sizes="(min-width: 640px) 50vw, 100vw" className="object-cover" /></div> : null}
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-brand-primary)]">{t.branchLabel}</p>
            <h2 className="mt-3 text-2xl font-semibold">{branch.name}</h2>
            <p className="mt-3 min-h-12 text-sm leading-7 text-[var(--color-text-muted)]">{branch.address || t.branchAddressSoon}</p>
            {(branch.map_url || branch.address) ? <a className="mt-6 inline-flex text-sm font-semibold underline underline-offset-4" target="_blank" rel="noreferrer" href={branch.map_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.address ?? "")}`}>{t.openMap} ↗</a> : null}
          </article>
        )) : <p className="text-[var(--color-text-muted)]">{t.noBranches}</p>}
      </div>
    </PageContainer>
  );
}
