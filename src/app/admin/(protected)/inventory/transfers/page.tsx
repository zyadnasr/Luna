import { requireAnyRole } from "@/lib/auth/server";
import { InventoryEmptyState } from "@/components/inventory/inventory-empty-state";
import { createClient } from "@/lib/supabase/server";
import { TransferActions } from "@/components/inventory/transfer-actions";
import { TransferForm } from "@/components/inventory/transfer-form";
import { getInventoryItems, getStockBatches } from "@/lib/inventory/queries";
import { getServerLocale } from "@/i18n/server";
import { translateAdminText } from "@/i18n/admin-text";
export default async function InventoryTransfersPage() {
  await requireAnyRole(["owner", "inventory"]);
  const [{ data: transfers }, { data: warehouses }, items, batches] = await Promise.all([
    (await createClient())
      .from("stock_transfers")
      .select("*")
      .order("created_at", { ascending: false }),
    (await createClient()).from("warehouses").select("id,name").eq("is_active", true),
    getInventoryItems(),
    getStockBatches(),
  ]);
  const locale = await getServerLocale();
  const t = (value: string) => translateAdminText(locale, value);
  return (
    <section>
      <h1 className="text-4xl font-semibold">{t("النقل بين المستودعات")}</h1>
      <p className="mt-3 text-[var(--color-text-muted)]">{t("نقل آمن بين Home وBlack Ball.")}</p>
      <div className="mt-8">
        <TransferForm warehouses={warehouses ?? []} items={items} batches={batches} />
        {transfers?.length ? (
          <div className="grid gap-3">
            {transfers.map((transfer) => (
              <div
                className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                key={transfer.id}
              >
                <div>
                  <p className="font-semibold">{transfer.status}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {new Date(transfer.created_at).toLocaleString("ar-EG")}
                  </p>
                </div>
                {transfer.status !== "completed" && transfer.status !== "cancelled" ? (
                  <TransferActions id={transfer.id} />
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <InventoryEmptyState title={t("لا توجد عمليات نقل")} />
        )}
      </div>
    </section>
  );
}
