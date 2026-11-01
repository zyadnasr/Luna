import { getCategories, getProducts } from "@/lib/catalog/queries";
import { PageContainer } from "@/components/ui/page-container";
import { EmptyCatalogState } from "@/components/catalog/empty-catalog-state";
import { MenuOrderControls } from "@/components/orders/menu-order-controls";
import { getServerLocale } from "@/i18n/server";
import { getPublicCopy } from "@/i18n/public";

export const dynamic = "force-dynamic";

export default async function OrderPage() {
  const locale = await getServerLocale();
  const t = getPublicCopy(locale);
  const [{ products }, categories] = await Promise.all([getProducts(), getCategories()]);
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
                  <div className="luna-menu-grid mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2">
                    {items.map((product) => {
                      const translation = product.product_translations.find(
                        (item) => item.locale === locale,
                      );
                      const prices = product.product_prices.filter(
                        (price) =>
                          price.is_active &&
                          (!price.valid_until || new Date(price.valid_until) > new Date()),
                      );
                      return (
                        <article
                          className="luna-menu-card luna-glass min-w-0 rounded-[1.15rem] border p-3 sm:rounded-[1.25rem] sm:p-4"
                          key={product.id}
                        >
                          <div className="flex min-h-[5rem] items-start rounded-[0.95rem] bg-[var(--color-background-deep)] p-3 sm:min-h-20">
                            <h3 className="line-clamp-3 text-[1.05rem] font-semibold leading-5 sm:text-xl sm:leading-normal">
                              {translation?.name}
                            </h3>
                          </div>
                          {product.availability_status === "available" ? (
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
                            />
                          ) : (
                            <p className="mt-3 text-xs leading-5 text-[var(--color-warning)] sm:text-sm">
                              {t.unavailable}
                            </p>
                          )}
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
