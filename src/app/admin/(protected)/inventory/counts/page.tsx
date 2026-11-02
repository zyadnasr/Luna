import { requireAnyRole } from "@/lib/auth/server";
import { InventoryEmptyState } from "@/components/inventory/inventory-empty-state";
import { createClient } from "@/lib/supabase/server";
import { completeCount, cancelCount, openCount } from "@/lib/inventory/actions";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getServerLocale } from "@/i18n/server";
import { translateAdminText } from "@/i18n/admin-text";
import { getTranslations } from "@/i18n/translations";
export default async function InventoryCountsPage() {
  await requireAnyRole(["owner", "inventory"]);
  const supabase = await createClient();
  const [{ data: counts }, { data: warehouses }] = await Promise.all([
    supabase.from("stock_counts").select("*").order("created_at", { ascending: false }),
    supabase.from("warehouses").select("id,name").eq("is_active", true),
  ]);
  const locale = await getServerLocale();
  const t = (value: string) => translateAdminText(locale, value);
  const translations = getTranslations(locale);
  const numberLocale = locale === "ar" ? "ar-EG" : locale;
  return (
    <section>
      <h1 className="text-4xl font-semibold">{t("جرد المخزون")}</h1>
      <p className="mt-3 text-[var(--color-text-muted)]">
        {t("الجرد ينشئ حركات تعديل ولا يكتب فوق السجل.")}
      </p>
      <div className="mt-8 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <form
          className="grid gap-4 md:grid-cols-[1fr_1fr_auto]"
          action={async (formData) => {
            const result = await openCount(
              String(formData.get("warehouse")),
              String(formData.get("reason")),
            );
            console.log(result.message);
          }}
        >
          <Select name="warehouse" defaultValue={warehouses?.[0]?.id}>
            <option value="">{t("اختر المستودع")}</option>
            {warehouses?.map((warehouse) => (
              <option value={warehouse.id} key={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </Select>
          <Input name="reason" placeholder={t("سبب الجرد")} required />
          <Button>{t("فتح جرد")}</Button>
        </form>
        {counts?.length ? (
          <div className="mt-6 grid gap-3">
            {counts.map((count) => (
              <div
                className="flex flex-wrap justify-between gap-3 border-t border-[var(--color-border)] pt-3"
                key={count.id}
              >
                <span>
                  {translations.inventory?.statuses[count.status] ?? count.status} ·{" "}
                  {new Date(count.created_at).toLocaleString(numberLocale)}
                </span>
                {count.status === "open" ? (
                  <div className="flex gap-2">
                    <form
                      action={async () => {
                        await completeCount(count.id);
                      }}
                    >
                      <Button>{t("إكمال")}</Button>
                    </form>
                    <form
                      action={async () => {
                        await cancelCount(count.id);
                      }}
                    >
                      <Button variant="secondary">{t("إلغاء")}</Button>
                    </form>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <InventoryEmptyState title={t("لا توجد عمليات جرد")} />
        )}
      </div>
    </section>
  );
}
