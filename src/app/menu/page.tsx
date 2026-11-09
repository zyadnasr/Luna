import Link from "next/link";
import Image from "next/image";
import { getCategories, getProducts, translationName } from "@/lib/catalog/queries";
import { EmptyCatalogState } from "@/components/catalog/empty-catalog-state";
import { PageContainer } from "@/components/ui/page-container";
import { StatusBadge } from "@/components/ui/status-badge";
import { MenuOrderControls } from "@/components/orders/menu-order-controls";
import { getServerLocale } from "@/i18n/server";
import { getPublicCopy, localizePriceLabel } from "@/i18n/public";
import {
  getProductAvailability,
  RECIPE_AVAILABILITY_ENABLED,
} from "@/lib/inventory/availability";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Menu | Healthy Cookies & Desserts",
  description:
    "Browse Luna Healthy's menu of cookies, biscuits and healthy desserts. Order for delivery across Cairo.",
  alternates: { canonical: "/menu" },
};

export default async function MenuPage() {
  const [{ products }, categories, locale] = await Promise.all([
    getProducts(),
    getCategories(),
    getServerLocale(),
  ]);
  const t = getPublicCopy(locale);
  const grouped = categories
    .map((category) => ({
      category,
      products: products.filter((product) => product.category_id === category.id),
    }))
    .filter((group) => group.products.length);
  const activePrices = products.flatMap((product) =>
    product.product_prices.filter(
      (price) =>
        price.is_active && (!price.valid_until || new Date(price.valid_until) > new Date()),
    ),
  );
  // Recipe availability is currently disabled. The active-price query already
  // contains everything needed for the public menu, so avoid one server query
  // per price while preserving the same result until recipes are re-enabled.
  const availabilityEntries = RECIPE_AVAILABILITY_ENABLED
    ? await Promise.all(
        activePrices.map(
          async (price) =>
            [price.id, (await getProductAvailability(price.product_id, price.id)).available] as const,
        ),
      )
    : activePrices.map((price) => [price.id, true] as const);
  const availabilityByPriceId = Object.fromEntries(availabilityEntries);
  return (
    <PageContainer className="max-w-7xl">
      <header className="flex flex-col items-start justify-between gap-5 border-b border-[var(--color-border)] pb-7 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-[var(--color-brand-primary)]">{t.menuEyebrow}</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-6xl">{t.menu}</h1>
          <p className="mt-3 max-w-xl leading-7 text-[var(--color-text-muted)]">
            {t.menuDescription}
          </p>
        </div>
        <Link
          href="/"
          className="text-sm font-semibold text-[var(--color-text-secondary)] underline"
        >
          {t.backHome}
        </Link>
      </header>
      {grouped.length === 0 ? (
        <div className="mx-auto max-w-2xl py-20">
          <EmptyCatalogState />
        </div>
      ) : (
        <div className="mt-7 grid gap-12">
          {grouped.map(({ category, products: categoryProducts }) => (
            <section aria-labelledby={`category-${category.id}`} key={category.id}>
              <div className="flex items-end justify-between gap-4 border-b border-[var(--color-border)] pb-3">
                <div>
                  <h2 id={`category-${category.id}`} className="mt-2 text-3xl font-semibold">
                    {translationName(category.category_translations, locale, category.slug)}
                  </h2>
                </div>
              </div>
              <div className="luna-menu-grid mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {categoryProducts.map((product) => {
                  const translation =
                    product.product_translations.find((item) => item.locale === locale) ??
                    product.product_translations[0];
                  const productPrices = product.product_prices.filter(
                    (price) =>
                      price.is_active &&
                      (!price.valid_until || new Date(price.valid_until) > new Date()),
                  );
                  const productAvailable =
                    product.availability_status === "available" &&
                    productPrices.some((price) => availabilityByPriceId[price.id] === true);
                  return (
                    <article
                      className="luna-product-card luna-menu-card luna-glass min-w-0 rounded-[1.15rem] border p-3 transition hover:-translate-y-0.5 sm:rounded-[1.25rem] sm:p-4"
                      key={product.id}
                    >
                      <Link href={`/menu/${product.id}`} className="block min-w-0">
                        <div className="luna-product-card__media relative" aria-hidden="true">
                          {product.image_url ? (
                            <Image
                              alt=""
                              className="rounded-[0.95rem] object-cover"
                              fill
                              loading="lazy"
                              sizes="(max-width: 639px) calc(100vw - 2rem), (max-width: 1023px) 50vw, 36rem"
                              src={product.image_url}
                            />
                          ) : null}
                          {productPrices.some(
                            (price) =>
                              price.compare_at_price_egp &&
                              price.compare_at_price_egp > price.price_egp,
                          ) ? (
                            <span className="absolute end-3 top-3 rounded-full bg-[#b86f6a] px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
                              {t.discountBadge}
                            </span>
                          ) : null}
                        </div>
                      </Link>
                      <div className="luna-product-card__content">
                        <div className="flex items-start justify-between gap-2">
                          <Link href={`/menu/${product.id}`} className="min-w-0">
                            <h3 className="line-clamp-3 text-base font-semibold leading-6 transition hover:text-[var(--color-brand-primary)] sm:text-xl sm:leading-7">
                              {translation?.name ?? t.menu}
                            </h3>
                          </Link>
                          {!productAvailable ? (
                            <span className="shrink-0 rounded-full border border-[var(--color-warning)]/30 px-2 py-1 text-[10px] font-semibold leading-none text-[var(--color-warning)]">
                              {t.unavailable}
                            </span>
                          ) : (
                            <StatusBadge status="success">{t.available}</StatusBadge>
                          )}
                        </div>
                        {translation?.description ? (
                          <Link href={`/menu/${product.id}`} className="mt-3 block">
                            <p className="line-clamp-3 text-sm leading-6 text-[var(--color-text-muted)] transition hover:text-[var(--color-text-secondary)]">
                              {translation.description}
                            </p>
                          </Link>
                        ) : null}
                        <div className="mt-4 border-t border-[var(--color-border)] pt-3 sm:mt-5 sm:pt-4">
                          {productPrices.length ? (
                            <div className="grid gap-1.5 sm:gap-2">
                              {productPrices.map((price) => (
                                <div
                                  className="flex items-baseline justify-between gap-2 text-xs sm:text-sm"
                                  key={price.id}
                                >
                                  <span className="min-w-0 truncate text-[var(--color-text-muted)]">
                                    {localizePriceLabel(price.label, locale) || t.price}
                                  </span>
                                  <span className="flex shrink-0 items-baseline gap-2 font-semibold tabular-nums">
                                    {price.compare_at_price_egp &&
                                    price.compare_at_price_egp > price.price_egp ? (
                                      <span className="text-[var(--color-text-muted)] line-through">
                                        {price.compare_at_price_egp.toLocaleString(
                                          locale === "ar" ? "ar-EG" : "en-EG",
                                        )}{" "}
                                        {t.egp}
                                      </span>
                                    ) : null}
                                    <span>
                                      {price.price_egp.toLocaleString(
                                        locale === "ar" ? "ar-EG" : "en-EG",
                                      )}{" "}
                                      {t.egp}
                                    </span>
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-[var(--color-text-muted)]">{t.priceLater}</p>
                          )}
                          {productAvailable ? (
                            <MenuOrderControls
                              productId={product.id}
                              productName={translation?.name}
                              productNames={Object.fromEntries(
                                product.product_translations.map((item) => [
                                  item.locale,
                                  item.name,
                                ]),
                              )}
                              prices={productPrices}
                              availabilityByPriceId={availabilityByPriceId}
                            />
                          ) : null}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
