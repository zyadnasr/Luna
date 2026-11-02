"use client";

import { useMemo, useState } from "react";
import { EmptyCatalogState } from "@/components/catalog/empty-catalog-state";
import { ProductActions } from "@/components/catalog/product-actions";
import { StatusBadge } from "@/components/ui/status-badge";
import { useLocale } from "@/components/ui/locale-provider";
import { translateAdminText } from "@/i18n/admin-text";
import type { CategoryWithTranslations, ProductWithCatalogData } from "@/types/catalog";

function translationName(
  translations: Array<{ locale: string; name: string }>,
  locale: string,
  fallback = "غير مسمى",
) {
  return (
    translations.find((item) => item.locale === locale)?.name ??
    translations.find((item) => item.locale === "ar")?.name ??
    fallback
  );
}

export function ProductsCatalog({
  products,
  categories,
}: {
  products: ProductWithCatalogData[];
  categories: CategoryWithTranslations[];
}) {
  const { locale } = useLocale();
  const t = (value: string) => translateAdminText(locale, value);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [animationKey, setAnimationKey] = useState(0);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    return products.filter((product) => {
      const matchesCategory = !categoryId || product.category_id === categoryId;
      const matchesSearch =
        !normalizedSearch ||
        product.product_translations.some((translation) =>
          translation.name.toLocaleLowerCase().includes(normalizedSearch),
        );
      return matchesCategory && matchesSearch;
    });
  }, [categoryId, products, search]);

  function updateFilter(update: () => void) {
    update();
    setAnimationKey((current) => current + 1);
  }

  const searchIcon = (
    <svg
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" strokeLinecap="round" />
    </svg>
  );

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <label className="relative min-w-60 flex-1">
          <span className="sr-only">{t("البحث في المنتجات")}</span>
          <span className="pointer-events-none absolute inset-y-0 start-4 grid place-items-center text-[var(--color-text-muted)]">
            {searchIcon}
          </span>
          <input
            className="min-h-12 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] ps-11 pe-4 text-sm outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-focus-ring)]"
            placeholder={t("ابحث باسم المنتج")}
            aria-label={t("البحث في المنتجات")}
            value={search}
            onChange={(event) => updateFilter(() => setSearch(event.target.value))}
          />
        </label>
        <label className="relative min-w-52">
          <span className="sr-only">{t("تصفية حسب التصنيف")}</span>
          <select
            className="min-h-12 w-full appearance-none rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 pe-10 text-sm outline-none transition focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-focus-ring)]"
            aria-label={t("تصفية حسب التصنيف")}
            value={categoryId}
            onChange={(event) => updateFilter(() => setCategoryId(event.target.value))}
          >
            <option value="">{t("كل التصنيفات")}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {translationName(category.category_translations, locale, category.slug)}
              </option>
            ))}
          </select>
          <svg
            className="pointer-events-none absolute inset-y-0 end-4 my-auto size-4 text-[var(--color-text-muted)]"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </label>
      </div>
      {products.length === 0 ? (
        <div className="mt-8">
          <EmptyCatalogState admin />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="mt-8 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] p-10 text-center text-sm text-[var(--color-text-muted)]">
          {t("لا توجد منتجات مطابقة.")}
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
          <table className="w-full min-w-[920px] text-start text-sm">
            <thead className="bg-[var(--color-background-deep)]/30 text-xs text-[var(--color-text-muted)]">
              <tr>
                {["المنتج", "التصنيف", "الحالة", "الترجمات", "الأسعار", "آخر تحديث", "إجراءات"].map(
                  (heading) => (
                    <th
                      className="border-b border-[var(--color-border)] px-5 py-4 font-semibold"
                      key={heading}
                    >
                      {t(heading)}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, index) => (
                <tr
                  className="catalog-product-row border-b border-[var(--color-border)] transition last:border-0 hover:bg-[var(--color-background-deep)]/25"
                  key={`${animationKey}-${product.id}`}
                  style={{ animationDelay: `${Math.min(index * 35, 280)}ms` }}
                >
                  <td className="px-5 py-5 font-semibold">
                    {translationName(product.product_translations, locale)}
                  </td>
                  <td className="px-5 py-5 text-[var(--color-text-muted)]">
                    {product.categories
                      ? translationName(
                          product.categories.category_translations,
                          locale,
                          product.categories.slug,
                        )
                      : t("بدون تصنيف")}
                  </td>
                  <td className="px-5 py-5">
                    <StatusBadge
                      status={
                        product.availability_status === "available"
                          ? "success"
                          : product.availability_status === "out_of_stock"
                            ? "warning"
                            : "info"
                      }
                    >
                      {product.availability_status === "available"
                        ? t("متاح")
                        : product.availability_status === "out_of_stock"
                          ? t("نفد")
                          : t("مخفي")}
                    </StatusBadge>
                  </td>
                  <td className="px-5 py-5 tabular-nums">
                    {product.product_translations.length}/3
                  </td>
                  <td className="px-5 py-5 tabular-nums">{product.product_prices.length}</td>
                  <td className="px-5 py-5 text-xs text-[var(--color-text-muted)]">
                    {new Date(product.updated_at).toLocaleDateString(
                      locale === "ar" ? "ar-EG" : locale,
                    )}
                  </td>
                  <td className="px-5 py-5">
                    <ProductActions id={product.id} availability={product.availability_status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
