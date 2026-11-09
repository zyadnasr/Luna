import { BranchesManager } from "@/components/admin/branches-manager";
import { getServerLocale } from "@/i18n/server";
import { translateAdminText } from "@/i18n/admin-text";
import { requireRole } from "@/lib/auth/server";
import { getBranches } from "@/lib/site/branches";

export const dynamic = "force-dynamic";

export default async function AdminBranchesPage() {
  await requireRole("owner");
  const [locale, branches] = await Promise.all([getServerLocale(), getBranches({ includeInactive: true })]);
  const t = (value: string) => translateAdminText(locale, value);
  return (
    <section className="mx-auto max-w-6xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-primary)]">{t("التشغيل")}</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{t("الفروع")}</h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--color-text-muted)]">{t("إدارة فروع Luna وعناوينها التي تظهر للزوار.")}</p>
      <div className="mt-8"><BranchesManager initialBranches={branches} /></div>
    </section>
  );
}
