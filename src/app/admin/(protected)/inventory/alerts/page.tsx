import { requireAnyRole } from "@/lib/auth/server";
import { InventoryEmptyState } from "@/components/inventory/inventory-empty-state";
import { getServerLocale } from "@/i18n/server";
import { translateAdminText } from "@/i18n/admin-text";
export default async function InventoryAlertsPage() {
  await requireAnyRole(["owner", "inventory", "manager"]);
  const locale = await getServerLocale();
  const t = (value: string) => translateAdminText(locale, value);
  return (
    <section>
      <h1 className="text-4xl font-semibold">{t("تنبيهات المخزون")}</h1>
      <p className="mt-3 text-[var(--color-text-muted)]">
        {t("المخزون المنخفض والدفعات القريبة من الانتهاء والوصفات المفقودة.")}
      </p>
      <div className="mt-8">
        <InventoryEmptyState title={t("لا توجد تنبيهات")} />
      </div>
    </section>
  );
}
