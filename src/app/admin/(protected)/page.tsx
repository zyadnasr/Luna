import { requirePermission, getCurrentProfile, getCurrentRoles } from "@/lib/auth/server";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { getServerLocale } from "@/i18n/server";
import { getAdminCopy } from "@/i18n/admin";

export default async function AdminPage() {
  const user = await requirePermission("admin.view_dashboard");
  const [profile, roles, locale] = await Promise.all([
    getCurrentProfile(user.id),
    getCurrentRoles(user.id),
    getServerLocale(),
  ]);
  const copy = getAdminCopy(locale);
  return (
    <section className="mx-auto max-w-6xl pb-12">
      <div className="flex flex-col justify-between gap-6 border-b border-[var(--color-border)] pb-8 md:flex-row md:items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-brand-primary)]">
            {copy.overview}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            {copy.greeting} {profile?.display_name ?? copy.fallbackName}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--color-text-muted)] sm:text-base">
            {copy.dashboardDescription}
          </p>
        </div>
        <div className="self-start pt-1">
          <StatusBadge status="success">{copy.connected}</StatusBadge>
        </div>
      </div>
      <div className="mt-8 grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] sm:p-8">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-brand-primary)]">
            {copy.systemReadiness}
          </p>
          <h2 className="mt-3 text-xl font-semibold tracking-[-0.025em]">{copy.foundationReady}</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">
            {copy.foundationDescription}
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-background-deep)]/35 p-4">
              <p className="text-xs text-[var(--color-text-muted)]">{copy.site}</p>
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold">
                <span
                  className="size-1.5 rounded-full bg-[var(--color-success)]"
                  aria-hidden="true"
                />
                {copy.ready}
              </p>
            </div>
            <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-background-deep)]/35 p-4">
              <p className="text-xs text-[var(--color-text-muted)]">{copy.roles}</p>
              <p className="mt-2 text-sm font-semibold">
                {roles.length} {copy.roleCount}
              </p>
            </div>
            <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-background-deep)]/35 p-4 opacity-70">
              <p className="text-xs text-[var(--color-text-muted)]">{copy.data}</p>
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold">
                <span
                  className="size-1.5 rounded-full bg-[var(--color-text-muted)]"
                  aria-hidden="true"
                />
                {copy.notStarted}
              </p>
            </div>
          </div>
        </section>
        <section className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] sm:p-8">
          <div
            className="pointer-events-none absolute -end-16 -top-20 size-56 rounded-full bg-[var(--color-brand-primary)]/10 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
              {copy.suggestedStep}
            </p>
            <h2 className="mt-3 text-xl font-semibold tracking-[-0.025em]">
              {copy.addTrustedUser}
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-7 text-[var(--color-text-muted)]">
              {copy.invitationDescription}
            </p>
          </div>
        </section>
      </div>
      <div className="mt-8">
        <EmptyState title={copy.operationalUnits} description={copy.operationalUnitsDescription} />
      </div>
    </section>
  );
}
