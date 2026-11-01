import { requireAnyRole } from "@/lib/auth/server";
import { InventoryItemForm } from "@/components/inventory/inventory-item-form";
import { getServerLocale } from "@/i18n/server";
import { translateAdminText } from "@/i18n/admin-text";
export default async function NewInventoryItemPage() {
  await requireAnyRole(["owner", "inventory"]);
  const locale = await getServerLocale();
  const t = (value: string) => translateAdminText(locale, value);
  return (
    <section>
      <h1 className="text-4xl font-semibold">{t("إضافة عنصر مخزون")}</h1>
      <p className="mt-3 text-[var(--color-text-muted)]">{t("أدخل بيانات مؤكدة فقط.")}</p>
      <div className="mt-8 max-w-xl">
        <InventoryItemForm />
      </div>
    </section>
  );
}
