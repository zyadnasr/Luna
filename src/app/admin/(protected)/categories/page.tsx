import { requirePermission } from "@/lib/auth/server";
import { getCategories } from "@/lib/catalog/queries";
import { CategoryManager } from "@/components/catalog/category-manager";
import { getServerLocale } from "@/i18n/server";
import { translateAdminText } from "@/i18n/admin-text";

export default async function CategoriesPage() {
  await requirePermission("catalog.manage");
  const categories = await getCategories(true);
  const locale = await getServerLocale();
  const t = (value: string) => translateAdminText(locale, value);
  return (
    <section>
      <div className="mb-8 border-b border-[var(--color-border)] pb-8">
        <p className="text-sm font-semibold text-[var(--color-brand-primary)]">
          {t("المنتجات والمخزون")}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">{t("التصنيفات")}</h1>
        <p className="mt-4 max-w-2xl leading-7 text-[var(--color-text-muted)]">
          {t("أنشئ تصنيفات القائمة ورتّب ظهورها. لا توجد تصنيفات تجريبية مضافة.")}
        </p>
      </div>
      <CategoryManager initial={categories} />
    </section>
  );
}
