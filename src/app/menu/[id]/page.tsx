import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/ui/page-container";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProductOrderPanel } from "@/components/catalog/product-order-panel";
import { getProduct, translationName } from "@/lib/catalog/queries";
import {
  getProductAvailability,
  RECIPE_AVAILABILITY_ENABLED,
} from "@/lib/inventory/availability";
import { getServerLocale } from "@/i18n/server";
import { getPublicCopy } from "@/i18n/public";
import { getSiteUrl } from "@/lib/seo";
import type { Locale } from "@/config/site";

export const dynamic = "force-dynamic";

type ProductPageProps = { params: Promise<{ id: string }> };

async function loadPublicProduct(id: string) {
  const product = await getProduct(id);
  if (!product || !product.is_active || product.availability_status === "hidden") notFound();
  return product;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const [product, locale] = await Promise.all([loadPublicProduct(id), getServerLocale()]);
  const name = translationName(product.product_translations, locale, product.sku ?? "Product");
  const description =
    product.product_translations.find((translation) => translation.locale === locale)?.description ??
    product.product_translations[0]?.description ??
    `Order ${name} from Luna Healthy.`;
  const image = product.image_url ? new URL(product.image_url, getSiteUrl()).toString() : undefined;
  return {
    title: name,
    description,
    alternates: { canonical: `/menu/${id}` },
    openGraph: {
      type: "website",
      title: name,
      description,
      ...(image ? { images: [{ url: image, alt: name }] } : {}),
    },
  };
}

function nutritionEntries(
  nutrition: NonNullable<Awaited<ReturnType<typeof getProduct>>>["nutrition_facts"],
  t: Record<string, string>,
) {
  if (!nutrition) return [];
  return [
    [t.calories, nutrition.calories ? `${nutrition.calories} kcal` : ""],
    [t.protein, nutrition.protein_g ? `${nutrition.protein_g} g` : ""],
    [t.carbohydrates, nutrition.carbohydrates_g ? `${nutrition.carbohydrates_g} g` : ""],
    [t.sugars, nutrition.sugars_g ? `${nutrition.sugars_g} g` : ""],
    [t.totalFat, nutrition.total_fat_g ? `${nutrition.total_fat_g} g` : ""],
    [t.fiber, nutrition.fiber_g ? `${nutrition.fiber_g} g` : ""],
    [t.cholesterol, nutrition.cholesterol_mg ? `${nutrition.cholesterol_mg} mg` : ""],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const [product, locale] = await Promise.all([loadPublicProduct(id), getServerLocale()]);
  const t = getPublicCopy(locale);
  const translation =
    product.product_translations.find((item) => item.locale === locale) ??
    product.product_translations[0];
  const categoryName = product.categories
    ? translationName(product.categories.category_translations, locale, product.categories.slug)
    : t.menu;
  const prices = product.product_prices.filter(
    (price) => price.is_active && (!price.valid_until || new Date(price.valid_until) > new Date()),
  );
  const availabilityEntries = RECIPE_AVAILABILITY_ENABLED
    ? await Promise.all(
        prices.map(
          async (price) => [price.id, (await getProductAvailability(product.id, price.id)).available] as const,
        ),
      )
    : prices.map((price) => [price.id, true] as const);
  const availabilityByPriceId = Object.fromEntries(availabilityEntries);
  const productAvailable =
    product.availability_status === "available" &&
    prices.some((price) => availabilityByPriceId[price.id] === true);
  const nutrition = nutritionEntries(product.nutrition_facts, t);
  const productNames = Object.fromEntries(
    product.product_translations.map((item) => [item.locale, item.name]),
  ) as Partial<Record<Locale, string>>;

  return (
    <PageContainer className="max-w-6xl">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-border)] pb-6">
        <Link href="/menu" className="text-sm font-semibold text-[var(--color-text-secondary)] underline">
          ← {t.backToMenu}
        </Link>
        <StatusBadge status={productAvailable ? "success" : "warning"}>
          {productAvailable ? t.available : t.unavailable}
        </StatusBadge>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)] lg:items-start">
        <div className="grid gap-7">
          <div className="luna-glass overflow-hidden rounded-[2rem] border p-3 shadow-[var(--shadow-elevated)] sm:p-5">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-[var(--color-background-deep)]">
              {product.image_url ? (
                <Image
                  alt={translation?.name ?? t.product}
                  className="object-cover"
                  fill
                  sizes="(max-width: 767px) 100vw, 50vw"
                  src={product.image_url}
                />
              ) : (
                <div className="grid size-full place-items-center text-sm text-[var(--color-text-muted)]">
                  {t.productDetails}
                </div>
              )}
              {prices.some(
                (price) => price.compare_at_price_egp && price.compare_at_price_egp > price.price_egp,
              ) ? (
                <span className="absolute end-4 top-4 rounded-full bg-[#b86f6a] px-3 py-1.5 text-xs font-bold text-white shadow-sm">
                  {t.discountBadge}
                </span>
              ) : null}
            </div>
          </div>

          {translation?.description ? (
            <section className="luna-glass rounded-[1.5rem] border p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-brand-primary)]">
                {categoryName}
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{translation.name}</h1>
              <p className="mt-5 max-w-2xl leading-8 text-[var(--color-text-muted)]">{translation.description}</p>
            </section>
          ) : (
            <section>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-brand-primary)]">{categoryName}</p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{translation?.name ?? t.product}</h1>
            </section>
          )}
        </div>

        <div className="grid gap-7 lg:sticky lg:top-28">
          <ProductOrderPanel
            productId={product.id}
            productName={translation?.name}
            productNames={productNames}
            prices={prices}
            availabilityByPriceId={availabilityByPriceId}
            available={productAvailable}
          />

          {translation?.ingredients_text || translation?.allergens_text ? (
            <section className="grid gap-5 rounded-[1.5rem] border border-[var(--glass-border)] bg-[var(--color-surface-glass)] p-6">
              {translation.ingredients_text ? (
                <div>
                  <h2 className="text-lg font-semibold">{t.ingredients}</h2>
                  <p className="mt-2 leading-7 text-[var(--color-text-muted)]">{translation.ingredients_text}</p>
                </div>
              ) : null}
              {translation.allergens_text ? (
                <div className="border-t border-[var(--color-border)] pt-5">
                  <h2 className="text-lg font-semibold">{t.allergens}</h2>
                  <p className="mt-2 leading-7 text-[var(--color-text-muted)]">{translation.allergens_text}</p>
                </div>
              ) : null}
            </section>
          ) : null}

          {nutrition.length ? (
            <section className="rounded-[1.5rem] border border-[var(--glass-border)] bg-[var(--color-surface-glass)] p-6">
              <h2 className="text-lg font-semibold">{t.nutrition}</h2>
              {product.nutrition_facts?.serving_size ? (
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                  {t.servingSize}: {product.nutrition_facts.serving_size}
                </p>
              ) : null}
              <dl className="mt-5 grid grid-cols-2 gap-3">
                {nutrition.map(([label, value]) => (
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3" key={label}>
                    <dt className="text-xs text-[var(--color-text-muted)]">{label}</dt>
                    <dd className="mt-1 font-semibold tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}
        </div>
      </div>
    </PageContainer>
  );
}
