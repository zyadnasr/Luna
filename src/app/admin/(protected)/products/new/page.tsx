import { requirePermission } from "@/lib/auth/server";
import { getCategories } from "@/lib/catalog/queries";
import { ProductForm } from "@/components/catalog/product-form";
import { getServerLocale } from "@/i18n/server";
import { translateAdminText } from "@/i18n/admin-text";
import Link from "next/link";

export default async function NewProductPage() {
  await requirePermission("catalog.manage");
  const categories = await getCategories(true);
  const locale = await getServerLocale();
  const t = (value: string) => translateAdminText(locale, value);
  return (
    <section className="mx-auto max-w-5xl pb-12">
      <div className="mb-8 border-b border-[var(--color-border)] pb-8">
        <Link
          href="/admin/products"
          className="mb-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)] transition hover:text-[var(--color-brand-primary)]"
        >
          <span aria-hidden="true">←</span> {t("المنتجات")}
        </Link>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-brand-primary)]">
          {t("المنتجات")}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
          {t("إضافة منتج")}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--color-text-muted)] sm:text-base">
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
