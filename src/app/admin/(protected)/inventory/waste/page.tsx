import { requireAnyRole } from "@/lib/auth/server";
import { InventoryEmptyState } from "@/components/inventory/inventory-empty-state";
import { createClient } from "@/lib/supabase/server";
import { getInventoryItems, getStockBatches } from "@/lib/inventory/queries";
import { WasteForm } from "@/components/inventory/waste-form";
import { getServerLocale } from "@/i18n/server";
import { translateAdminText } from "@/i18n/admin-text";
export default async function InventoryWastePage() {
  await requireAnyRole(["owner", "inventory"]);
  const [items, batches, { data: warehouses }, { data: waste }] = await Promise.all([
    getInventoryItems(),
    getStockBatches(),
    (await createClient()).from("warehouses").select("id,name").eq("is_active", true),
    (await createClient())
      .from("stock_waste")
      .select("*, inventory_items(name_ar), warehouses(name)")
      .order("created_at", { ascending: false }),
  ]);
  const locale = await getServerLocale();
  const t = (value: string) => translateAdminText(locale, value);
  const numberLocale = locale === "ar" ? "ar-EG" : locale;
  return (
    <section>
      <h1 className="text-4xl font-semibold">{t("الهدر والتلف")}</h1>
      <p className="mt-3 text-[var(--color-text-muted)]">
        {t("تسجيل الكميات التالفة أو المنتهية.")}
      </p>
      <div className="mt-8">
        <WasteForm items={items} batches={batches} warehouses={warehouses ?? []} />
        {waste?.length ? (
          <div className="mt-6 grid gap-3">
            {waste.map((record) => (
              <div
                className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                key={record.id}
              >
                <p className="font-semibold">
                  {record.inventory_items?.name_ar} · {record.quantity}
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  {t(record.reason)} · {new Date(record.created_at).toLocaleString(numberLocale)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <InventoryEmptyState title={t("لا توجد سجلات هدر")} />
        )}
      </div>
    </section>
  );
}
