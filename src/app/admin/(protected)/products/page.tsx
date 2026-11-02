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
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-pill)] bg-[var(--color-brand-secondary)] px-5 text-sm font-semibold text-[var(--color-on-brand)] shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:bg-[var(--color-brand-primary-deep)] active:translate-y-0"
          href="/admin/products/new"
        >
          <svg
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          {t("إضافة منتج")}
        </Link>
      </div>
      <ProductsCatalog products={products} categories={categories} />
    </section>
  );
}
