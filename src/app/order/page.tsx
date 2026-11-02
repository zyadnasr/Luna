import { getCategories, getProducts } from "@/lib/catalog/queries";
import { PageContainer } from "@/components/ui/page-container";
import { EmptyCatalogState } from "@/components/catalog/empty-catalog-state";
import { MenuOrderControls } from "@/components/orders/menu-order-controls";
import { getServerLocale } from "@/i18n/server";
import { getPublicCopy } from "@/i18n/public";
import { getProductAvailability } from "@/lib/inventory/availability";

export const dynamic = "force-dynamic";

export default async function OrderPage() {
  const locale = await getServerLocale();
  const t = getPublicCopy(locale);
  const [{ products }, categories] = await Promise.all([getProducts(), getCategories()]);
  const activePrices = products.flatMap((product) =>
    product.product_prices.filter(
      (price) =>
        price.is_active && (!price.valid_until || new Date(price.valid_until) > new Date()),
    ),
  );
  const availabilityEntries = await Promise.all(
    activePrices.map(
      async (price) =>
        [price.id, (await getProductAvailability(price.product_id, price.id)).available] as const,
    ),
  );
  const availabilityByPriceId = Object.fromEntries(availabilityEntries);
  return (
    <PageContainer className="max-w-6xl">
      <header className="border-b border-[var(--color-border)] pb-7">
        <p className="text-sm font-semibold text-[var(--color-brand-primary)]">{t.deliveryOrder}</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-6xl">{t.order}</h1>
        <p className="mt-4 text-[var(--color-text-muted)]">{t.cairoOnly}</p>
      </header>
      {!products.length ? (
        <div className="py-16">
          <EmptyCatalogState />
        </div>
      ) : (
        <div className="mt-8">
          <div className="grid gap-8">
            {categories.map((category) => {
              const items = products.filter((product) => product.category_id === category.id);
              return items.length ? (
                <section key={category.id}>
                  <h2 className="text-2xl font-semibold">
                    {category.category_translations.find((item) => item.locale === locale)?.name ??
                      category.slug}
                  </h2>
                  <div className="luna-menu-grid mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {items.map((product) => {
                      const translation =
                        product.product_translations.find((item) => item.locale === locale) ??
                        product.product_translations[0];
                      const prices = product.product_prices.filter(
                        (price) =>
                          price.is_active &&
                          (!price.valid_until || new Date(price.valid_until) > new Date()),
                      );
                      const productAvailable =
                        product.availability_status === "available" &&
                        prices.some((price) => availabilityByPriceId[price.id] === true);
                      return (
                        <article
                          className="luna-product-card luna-menu-card luna-glass min-w-0 rounded-[1.15rem] border p-3 sm:rounded-[1.25rem] sm:p-4"
                          key={product.id}
                        >
                          <div className="luna-product-card__media" aria-hidden="true" />
                          <div className="luna-product-card__content">
                            <h3 className="line-clamp-3 text-base font-semibold leading-6 sm:text-xl sm:leading-7">
                              {translation?.name}
                            </h3>
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
                                prices={prices}
                                availabilityByPriceId={availabilityByPriceId}
                              />
                            ) : (
                              <p className="mt-3 text-xs leading-5 text-[var(--color-warning)] sm:text-sm">
                                {t.unavailable}
                              </p>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ) : null;
            })}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
