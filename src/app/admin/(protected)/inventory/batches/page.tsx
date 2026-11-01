import { requireAnyRole } from "@/lib/auth/server";
import { InventoryEmptyState } from "@/components/inventory/inventory-empty-state";
import { getInventoryItems, getStockBatches } from "@/lib/inventory/queries";
import { createClient } from "@/lib/supabase/server";
import { BatchReceiveForm } from "@/components/inventory/batch-receive-form";
import { getServerLocale } from "@/i18n/server";
import { translateAdminText } from "@/i18n/admin-text";
export default async function InventoryBatchesPage() {
  await requireAnyRole(["owner", "inventory"]);
  const [items, batches, { data: warehouses }] = await Promise.all([
    getInventoryItems(),
    getStockBatches(),
    (await createClient()).from("warehouses").select("id,name").eq("is_active", true),
  ]);
  const locale = await getServerLocale();
  const t = (value: string) => translateAdminText(locale, value);
  return (
    <section>
      <h1 className="text-4xl font-semibold">{t("دفعات المخزون")}</h1>
      <p className="mt-3 text-[var(--color-text-muted)]">{t("استلام الدفعات وتواريخ الانتهاء.")}</p>
      <div className="mt-8">
        <BatchReceiveForm
          items={items.map((item) => ({ id: item.id, name: item.name_ar, unit: item.unit }))}
          warehouses={warehouses ?? []}
        />
        {batches.length ? (
          <div className="mt-6 overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr>
                  {["العنصر", "المستودع", "الدفعة", "المتاح", "الانتهاء", "الاستلام"].map(
                    (heading) => (
                      <th className="px-4 py-3 text-start" key={heading}>
                        {t(heading)}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => (
                  <tr className="border-t border-[var(--color-border)]" key={batch.id}>
                    <td className="px-4 py-3">{batch.inventory_items?.name_ar ?? "-"}</td>
                    <td className="px-4 py-3">{batch.warehouses?.name ?? "-"}</td>
                    <td className="px-4 py-3">{batch.batch_number ?? "-"}</td>
                    <td className="px-4 py-3">
                      {batch.quantity_available} {batch.inventory_items?.unit}
                    </td>
                    <td className="px-4 py-3">{batch.expiry_date ?? "-"}</td>
                    <td className="px-4 py-3">
                      {new Date(batch.received_at).toLocaleDateString("ar-EG")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <InventoryEmptyState
            title={t("لا توجد دفعات")}
            description={t("لن تظهر دفعات حتى يتم استلام مخزون حقيقي.")}
          />
        )}
      </div>
    </section>
  );
}
