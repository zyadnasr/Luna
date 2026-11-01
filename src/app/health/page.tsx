import { getTranslations } from "@/i18n";
import { PageContainer } from "@/components/ui/page-container";
import { StatusBadge } from "@/components/ui/status-badge";

export default function HealthPage() {
  const t = getTranslations();
  return (
    <PageContainer className="max-w-7xl">
      <section className="mx-auto max-w-3xl py-10 sm:py-20">
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-[var(--shadow-elevated)] sm:p-12">
          <div className="flex items-center justify-between gap-5">
            <div>
              <p className="text-sm text-[var(--color-text-muted)]">{t.health.status}</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight">{t.health.title}</h1>
            </div>
            <StatusBadge status="success">{t.health.ready}</StatusBadge>
          </div>
          <p className="mt-7 max-w-xl leading-8 text-[var(--color-text-secondary)]">
            {t.health.description}
          </p>
          <div className="mt-10 grid gap-3 border-t border-[var(--color-border)] pt-6 sm:grid-cols-2">
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">التطبيق</p>
              <p className="mt-1 font-semibold">Luna Healthy</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">الواجهة</p>
              <p className="mt-1 font-semibold">جاهزة للعمل</p>
            </div>
          </div>
        </div>
      </section>
    </PageContainer>
  );
}
