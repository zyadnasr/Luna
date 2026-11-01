import Link from "next/link";
import { requireAnyRole } from "@/lib/auth/server";
import { InventoryEmptyState } from "@/components/inventory/inventory-empty-state";
import { getServerLocale } from "@/i18n/server";
import { translateAdminText } from "@/i18n/admin-text";
export default async function RecipesPage() {
  await requireAnyRole(["owner", "inventory"]);
  const locale = await getServerLocale();
  const t = (value: string) => translateAdminText(locale, value);
  return (
    <section>
      <div className="flex items-end justify-between border-b border-[var(--color-border)] pb-8">
        <div>
          <h1 className="text-4xl font-semibold">{t("الوصفات")}</h1>
          <p className="mt-3 text-[var(--color-text-muted)]">
            {t("اربط المنتجات والخيارات بعناصر المخزون يدويًا.")}
          </p>
        </div>
        <Link
          className="rounded-[var(--radius-pill)] bg-[var(--color-brand-secondary)] px-5 py-3 text-sm text-[var(--color-on-brand)]"
          href="/admin/inventory/recipes/new"
        >
          {t("وصفة جديدة")}
        </Link>
      </div>
      <div className="mt-8">
        <InventoryEmptyState
          title={t("لا توجد وصفات")}
          description={t("لن يتم إنشاء وصفات تلقائيًا.")}
        />
      </div>
    </section>
  );
}
