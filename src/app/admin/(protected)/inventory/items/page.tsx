import Link from "next/link";
import { requireAnyRole } from "@/lib/auth/server";
import { getInventoryItems } from "@/lib/inventory/queries";
import { InventoryEmptyState } from "@/components/inventory/inventory-empty-state";
import { getServerLocale } from "@/i18n/server";
import { translateAdminText } from "@/i18n/admin-text";
export default async function InventoryItemsPage() {
  await requireAnyRole(["owner", "inventory"]);
  const items = await getInventoryItems();
  const locale = await getServerLocale();
  const t = (value: string) => translateAdminText(locale, value);
  return (
    <section>
      <div className="flex items-end justify-between border-b border-[var(--color-border)] pb-8">
        <div>
          <h1 className="text-4xl font-semibold">{t("عناصر المخزون")}</h1>
          <p className="mt-3 text-[var(--color-text-muted)]">
            {t("المكونات والتغليف والمنتجات النهائية.")}
          </p>
        </div>
        <Link
          className="rounded-[var(--radius-pill)] bg-[var(--color-brand-secondary)] px-5 py-3 text-sm text-[var(--color-on-brand)]"
          href="/admin/inventory/items/new"
        >
          {t("إضافة عنصر")}
        </Link>
      </div>
      <div className="mt-8">
        {items.length ? (
          <div className="grid gap-3">
            {items.map((item) => (
              <div
                className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                key={item.id}
              >
                <p className="font-semibold">{item.name_ar}</p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {item.item_type} · {item.unit}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <InventoryEmptyState />
        )}
      </div>
    </section>
  );
}
