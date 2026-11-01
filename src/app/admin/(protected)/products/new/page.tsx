import { requirePermission } from "@/lib/auth/server";
import { getCategories } from "@/lib/catalog/queries";
import { ProductForm } from "@/components/catalog/product-form";
import { getServerLocale } from "@/i18n/server";
import { translateAdminText } from "@/i18n/admin-text";

export default async function NewProductPage() {
  await requirePermission("catalog.manage");
  const categories = await getCategories(true);
  const locale = await getServerLocale();
  const t = (value: string) => translateAdminText(locale, value);
  return (
    <section>
      <div className="mb-8 border-b border-[var(--color-border)] pb-8">
        <p className="text-sm font-semibold text-[var(--color-brand-primary)]">{t("المنتجات")}</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">{t("إضافة منتج")}</h1>
        <p className="mt-4 text-[var(--color-text-muted)]">
          {locale === "ar"
            ? "أدخل المعلومات المؤكدة فقط. الاسم العربي هو الحقل المطلوب."
            : locale === "it"
              ? "Inserisci solo informazioni confermate. Il nome arabo è obbligatorio."
              : "Enter confirmed information only. The Arabic name is required."}
        </p>
      </div>
      <ProductForm
        categories={categories.map((category) => ({
          id: category.id,
          name:
            category.category_translations.find((translation) => translation.locale === "ar")
              ?.name ?? category.slug,
        }))}
      />
    </section>
  );
}
