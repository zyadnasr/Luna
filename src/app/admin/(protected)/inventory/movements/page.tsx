import { requireAnyRole } from "@/lib/auth/server";
import { InventoryEmptyState } from "@/components/inventory/inventory-empty-state";
import { getStockMovements } from "@/lib/inventory/queries";
import { getServerLocale } from "@/i18n/server";
import { translateAdminText } from "@/i18n/admin-text";
import { getTranslations } from "@/i18n/translations";
export default async function InventoryMovementsPage() {
  await requireAnyRole(["owner", "inventory", "manager"]);
  const movements = await getStockMovements();
  const locale = await getServerLocale();
  const t = (value: string) => translateAdminText(locale, value);
  const translations = getTranslations(locale);
  const numberLocale = locale === "ar" ? "ar-EG" : locale;
  return (
    <section>
      <h1 className="text-4xl font-semibold">{t("حركات المخزون")}</h1>
      <p className="mt-3 text-[var(--color-text-muted)]">
        {t("سجل غير قابل للتعديل لكل حركة مخزون.")}
      </p>
      <div className="mt-8">
        {movements.length ? (
          <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr>
                  {["العنصر", "المستودع", "النوع", "الكمية", "الدفعة", "التاريخ"].map((heading) => (
                    <th className="px-4 py-3 text-start" key={heading}>
                      {t(heading)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => (
                  <tr className="border-t border-[var(--color-border)]" key={movement.id}>
                    <td className="px-4 py-3">{movement.inventory_items?.name_ar ?? "-"}</td>
                    <td className="px-4 py-3">{movement.warehouses?.name ?? "-"}</td>
                    <td className="px-4 py-3">
                      {translations.inventory?.movements[movement.movement_type] ??
                        movement.movement_type}
                    </td>
                    <td className="px-4 py-3">{movement.quantity_delta}</td>
                    <td className="px-4 py-3">{movement.stock_batches?.batch_number ?? "-"}</td>
                    <td className="px-4 py-3">
                      {new Date(movement.created_at).toLocaleString(numberLocale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <InventoryEmptyState title={t("لا توجد حركات")} />
        )}
      </div>
    </section>
  );
}
