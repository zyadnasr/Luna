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

  return (
    <>
      <div className="mt-8 flex flex-wrap gap-3">
        <input
          className="min-h-11 min-w-60 flex-1 rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm"
          placeholder={t("ابحث باسم المنتج")}
          aria-label={t("البحث في المنتجات")}
          value={search}
          onChange={(event) => updateFilter(() => setSearch(event.target.value))}
        />
        <select
          className="min-h-11 rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm"
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
          <table className="w-full min-w-[860px] text-start text-sm">
            <thead className="bg-[rgba(128,128,96,0.08)]">
              <tr>
                {["المنتج", "التصنيف", "الحالة", "الترجمات", "الأسعار", "آخر تحديث", "إجراءات"].map(
                  (heading) => (
                    <th className="px-4 py-4 font-semibold" key={heading}>
                      {t(heading)}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, index) => (
                <tr
                  className="catalog-product-row border-t border-[var(--color-border)]"
                  key={`${animationKey}-${product.id}`}
                  style={{ animationDelay: `${Math.min(index * 35, 280)}ms` }}
                >
                  <td className="px-4 py-4 font-semibold">
                    {translationName(product.product_translations, locale)}
                  </td>
                  <td className="px-4 py-4 text-[var(--color-text-muted)]">
                    {product.categories
                      ? translationName(
                          product.categories.category_translations,
                          locale,
                          product.categories.slug,
                        )
                      : t("بدون تصنيف")}
                  </td>
                  <td className="px-4 py-4">
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
                  <td className="px-4 py-4">{product.product_translations.length}/3</td>
                  <td className="px-4 py-4">{product.product_prices.length}</td>
                  <td className="px-4 py-4 text-xs text-[var(--color-text-muted)]">
                    {new Date(product.updated_at).toLocaleDateString(
                      locale === "ar" ? "ar-EG" : locale,
                    )}
                  </td>
                  <td className="px-4 py-4">
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
