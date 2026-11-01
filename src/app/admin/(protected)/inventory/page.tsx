import Link from "next/link";
import { requireAnyRole } from "@/lib/auth/server";
import { getInventorySummary } from "@/lib/inventory/queries";
import { InventoryEmptyState } from "@/components/inventory/inventory-empty-state";
import { getServerLocale } from "@/i18n/server";
import { translateAdminText } from "@/i18n/admin-text";
export const dynamic = "force-dynamic";
export default async function InventoryPage() {
  await requireAnyRole(["owner", "inventory", "manager"]);
  const summary = await getInventorySummary();
  const locale = await getServerLocale();
  const t = (value: string) => translateAdminText(locale, value);
  return (
    <section>
      <div className="border-b border-[var(--color-border)] pb-8">
        <p className="text-sm font-semibold text-[var(--color-brand-primary)]">
          {t("المنتجات والمخزون")}
        </p>
        <h1 className="mt-3 text-4xl font-semibold">{t("المخزون")}</h1>
        <p className="mt-4 text-[var(--color-text-muted)]">
          {t("مخزون الدار البيضاء والمستودع المنزلي، بدون بيانات تجريبية.")}
        </p>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Link
          className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
          href="/admin/inventory/items"
        >
          <p className="text-sm text-[var(--color-text-muted)]">{t("العناصر")}</p>
          <p className="mt-2 text-3xl font-semibold">{summary.items.length}</p>
        </Link>
        <Link
          className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
          href="/admin/inventory/batches"
        >
          <p className="text-sm text-[var(--color-text-muted)]">{t("الدفعات")}</p>
          <p className="mt-2 text-3xl font-semibold">{summary.batches.length}</p>
        </Link>
        <Link
          className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
          href="/admin/inventory/movements"
        >
          <p className="text-sm text-[var(--color-text-muted)]">{t("الحركات")}</p>
          <p className="mt-2 text-3xl font-semibold">{summary.movementCount}</p>
        </Link>
      </div>
      <div className="mt-8">
        <InventoryEmptyState />
      </div>
    </section>
  );
}
