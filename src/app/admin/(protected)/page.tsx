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
    <section>
      <div className="flex flex-col justify-between gap-6 border-b border-[var(--color-border)] pb-8 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold text-[var(--color-brand-primary)]">{copy.overview}</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            {copy.greeting} {profile?.display_name ?? copy.fallbackName}
          </h1>
          <p className="mt-4 max-w-xl leading-7 text-[var(--color-text-muted)]">
            {copy.dashboardDescription}
          </p>
        </div>
        <StatusBadge status="success">{copy.connected}</StatusBadge>
      </div>
      <div className="mt-8 grid gap-5 md:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] sm:p-8">
          <p className="text-xs font-semibold tracking-[0.12em] text-[var(--color-text-muted)]">
            {copy.systemReadiness}
          </p>
          <h2 className="mt-3 text-2xl font-semibold">{copy.foundationReady}</h2>
          <p className="mt-3 leading-7 text-[var(--color-text-secondary)]">
            {copy.foundationDescription}
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[var(--radius-sm)] bg-[rgba(128,128,96,0.09)] p-4">
              <p className="text-xs text-[var(--color-text-muted)]">{copy.site}</p>
              <p className="mt-2 font-semibold">{copy.ready}</p>
            </div>
            <div className="rounded-[var(--radius-sm)] bg-[rgba(128,128,96,0.09)] p-4">
              <p className="text-xs text-[var(--color-text-muted)]">{copy.roles}</p>
              <p className="mt-2 font-semibold">
                {roles.length} {copy.roleCount}
              </p>
            </div>
            <div className="rounded-[var(--radius-sm)] bg-[rgba(128,128,96,0.09)] p-4">
              <p className="text-xs text-[var(--color-text-muted)]">{copy.data}</p>
              <p className="mt-2 font-semibold">{copy.notStarted}</p>
            </div>
          </div>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-brand-secondary)] p-6 text-[var(--color-on-brand)] shadow-[var(--shadow-soft)] sm:p-8">
          <p className="text-xs font-semibold text-[var(--color-on-brand-muted)]">
            {copy.suggestedStep}
          </p>
          <h2 className="mt-3 text-2xl font-semibold">{copy.addTrustedUser}</h2>
          <p className="mt-3 leading-7 text-[var(--color-on-brand-muted)]">
            {copy.invitationDescription}
          </p>
        </div>
      </div>
      <div className="mt-8">
        <EmptyState title={copy.operationalUnits} description={copy.operationalUnitsDescription} />
      </div>
    </section>
  );
}
