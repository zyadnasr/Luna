import Link from "next/link";
import { requirePermission } from "@/lib/auth/server";
import { getCategories, getProducts } from "@/lib/catalog/queries";
import { ProductsCatalog } from "@/components/catalog/products-catalog";
import { getServerLocale } from "@/i18n/server";
import { translateAdminText } from "@/i18n/admin-text";

export default async function ProductsPage() {
  await requirePermission("catalog.manage");
  const [{ products }, categories] = await Promise.all([getProducts(), getCategories(true)]);
  const locale = await getServerLocale();
  const t = (value: string) => translateAdminText(locale, value);
  return (
    <section>
      <div className="flex flex-col justify-between gap-5 border-b border-[var(--color-border)] pb-8 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold text-[var(--color-brand-primary)]">
            {t("المنتجات والمخزون")}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">{t("المنتجات")}</h1>
          <p className="mt-4 max-w-2xl leading-7 text-[var(--color-text-muted)]">
            {t("أدر معلومات المنتجات وترجماتها وأسعارها من مكان واحد.")}
          </p>
        </div>
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-pill)] bg-[var(--color-brand-secondary)] px-5 text-sm font-semibold text-[var(--color-on-brand)]"
          href="/admin/products/new"
        >
          {t("إضافة منتج")}
        </Link>
      </div>
      <ProductsCatalog products={products} categories={categories} />
    </section>
  );
}
