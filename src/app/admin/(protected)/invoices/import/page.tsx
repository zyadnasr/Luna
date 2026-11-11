import { requirePermission } from "@/lib/auth/server";
import { getServerLocale } from "@/i18n/server";
import { translateAdminText } from "@/i18n/admin-text";
import { OrderImportForm } from "@/components/admin/order-import-form";

export const dynamic = "force-dynamic";

export default async function ImportOrdersPage() {
  await requirePermission("invoices.view");
  const locale = await getServerLocale();
  const t = (value: string) => translateAdminText(locale, value);
  return (
    <section className="mx-auto max-w-3xl pb-12">
      <div className="border-b border-[var(--color-border)] pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-brand-primary)]">
          {t("استيراد البيانات")}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
          {t("استيراد الطلبات")}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--color-text-muted)] sm:text-base">
          {t("ارفع ملف Excel لإنشاء الطلبات الخارجية دفعة واحدة مع تسجيل الأخطاء لكل صف.")}
        </p>
      </div>
      <div className="mt-8 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] sm:p-8">
        <OrderImportForm />
      </div>
    </section>
  );
}
