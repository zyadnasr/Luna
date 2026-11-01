import { requireAnyRole } from "@/lib/auth/server";
import { InventoryEmptyState } from "@/components/inventory/inventory-empty-state";
import { getServerLocale } from "@/i18n/server";
import { translateAdminText } from "@/i18n/admin-text";
export default async function NewRecipePage() {
  await requireAnyRole(["owner", "inventory"]);
  const locale = await getServerLocale();
  const t = (value: string) => translateAdminText(locale, value);
  return (
    <section>
      <h1 className="text-4xl font-semibold">{t("وصفة جديدة")}</h1>
      <div className="mt-8">
        <InventoryEmptyState
          title={t("محرر الوصفات قيد الإعداد")}
          description={t("لن يتم إنشاء وصفة بدون اختيار منتج وعناصر مخزون حقيقية.")}
        />
      </div>
    </section>
  );
}
