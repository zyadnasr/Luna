import { getCategories, getProducts } from "@/lib/catalog/queries";
import { createClient } from "@/lib/supabase/server";
import { PageContainer } from "@/components/ui/page-container";
import { EmptyCatalogState } from "@/components/catalog/empty-catalog-state";
import { MenuOrderControls } from "@/components/orders/menu-order-controls";
import { CheckoutForm } from "@/components/orders/checkout-form";
import { getServerLocale } from "@/i18n/server";
import { getPublicCopy } from "@/i18n/public";

export const dynamic = "force-dynamic";

export default async function OrderPage() {
  const supabase = await createClient();
  const locale = await getServerLocale();
  const t = getPublicCopy(locale);
  const [{ products }, categories, { data: zones }] = await Promise.all([
    getProducts(),
    getCategories(),
    supabase
      .from("delivery_zones")
      .select("id, name_ar, name_en, name_it, delivery_fee_egp")
      .eq("is_active", true)
      .order("sort_order"),
  ]);
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
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="grid gap-8">
            {categories.map((category) => {
              const items = products.filter((product) => product.category_id === category.id);
              return items.length ? (
                <section key={category.id}>
                  <h2 className="text-2xl font-semibold">
                    {category.category_translations.find((item) => item.locale === locale)?.name ??
                      category.slug}
                  </h2>
                  <div className="mt-4 grid gap-4">
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
                          className="rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                          key={product.id}
                        >
                          <h3 className="font-semibold">{translation?.name}</h3>
                          {product.availability_status === "available" ? (
                            <MenuOrderControls
                              productId={product.id}
                              productName={translation?.name}
                              prices={prices}
                            />
                          ) : (
                            <p className="mt-4 text-sm text-[var(--color-warning)]">{t.unavailable}</p>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </section>
              ) : null;
            })}
          </div>
          <aside className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] lg:sticky lg:top-24 lg:h-fit">
            <h2 className="text-xl font-semibold">{t.deliveryData}</h2>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">{t.recheck}</p>
            <div className="mt-6">
              <CheckoutForm zones={zones ?? []} context={{ type: "delivery" }} />
            </div>
          </aside>
        </div>
      )}
    </PageContainer>
  );
}
