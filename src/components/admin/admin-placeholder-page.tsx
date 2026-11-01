import { getServerLocale } from "@/i18n/server";
import { translateAdminText } from "@/i18n/admin-text";

export async function AdminPlaceholderPage({ title }: { title: string }) {
  const locale = await getServerLocale();
  const t = (value: string) => translateAdminText(locale, value);

  return (
    <section>
      <div className="border-b border-[var(--color-border)] pb-8">
        <p className="text-sm font-semibold text-[var(--color-brand-primary)]">{t(title)}</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">{t(title)}</h1>
      </div>
      <div className="mt-8 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center shadow-[var(--shadow-card)]">
        <h2 className="text-2xl font-semibold">{t("هذه الوحدة قيد الإعداد")}</h2>
        <p className="mx-auto mt-3 max-w-xl leading-7 text-[var(--color-text-muted)]">
          {t("ستظهر هنا البيانات التشغيلية عند تفعيل هذه الوحدة.")}
        </p>
      </div>
    </section>
  );
}
