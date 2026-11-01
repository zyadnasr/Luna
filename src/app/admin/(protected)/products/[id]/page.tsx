import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/server";
import { getCategories, getProduct } from "@/lib/catalog/queries";
import { ProductForm } from "@/components/catalog/product-form";
import { getServerLocale } from "@/i18n/server";
import { translateAdminText } from "@/i18n/admin-text";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("catalog.manage");
  const { id } = await params;
  const [product, categories] = await Promise.all([getProduct(id), getCategories(true)]);
  if (!product) notFound();
  const locale = await getServerLocale();
  const t = (value: string) => translateAdminText(locale, value);
  const nutrition = product.nutrition_facts;
  return (
    <section>
      <div className="mb-8 border-b border-[var(--color-border)] pb-8">
        <p className="text-sm font-semibold text-[var(--color-brand-primary)]">{t("المنتجات")}</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          {locale === "ar"
            ? "تعديل المنتج"
            : locale === "it"
              ? "Modifica prodotto"
              : "Edit product"}
        </h1>
        <p className="mt-4 text-[var(--color-text-muted)]">
          {t("حدّث المعلومات من المصدر، ولا تعتمد على بيانات غير مؤكدة.")}
        </p>
      </div>
      <ProductForm
        categories={categories.map((category) => ({
          id: category.id,
          name:
            category.category_translations.find((translation) => translation.locale === locale)
              ?.name ?? category.slug,
        }))}
        initial={{
          id: product.id,
          category_id: product.category_id,
          sku: product.sku ?? "",
          is_active: product.is_active,
          availability_status: product.availability_status,
          translations: product.product_translations,
          prices: product.product_prices.map((price) => ({
            id: price.id,
            label: price.label ?? "",
            price_egp: price.price_egp,
            is_active: price.is_active,
            valid_from: price.valid_from.slice(0, 16),
            valid_until: price.valid_until?.slice(0, 16) ?? "",
          })),
          nutrition: nutrition
            ? {
                serving_size: nutrition.serving_size ?? "",
                calories: nutrition.calories,
                protein_g: nutrition.protein_g,
                carbohydrates_g: nutrition.carbohydrates_g,
                sugars_g: nutrition.sugars_g,
                total_fat_g: nutrition.total_fat_g,
                saturated_fat_g: nutrition.saturated_fat_g,
                trans_fat_g: nutrition.trans_fat_g,
                fiber_g: nutrition.fiber_g,
                cholesterol_mg: nutrition.cholesterol_mg,
                source_image_path: nutrition.source_image_path ?? "",
                notes: nutrition.notes ?? "",
              }
            : {
                serving_size: "",
                calories: null,
                protein_g: null,
                carbohydrates_g: null,
                sugars_g: null,
                total_fat_g: null,
                saturated_fat_g: null,
                trans_fat_g: null,
                fiber_g: null,
                cholesterol_mg: null,
                source_image_path: "",
                notes: "",
              },
        }}
      />
    </section>
  );
}
