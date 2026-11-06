"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { saveProduct, saveProductImage } from "@/lib/catalog/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/components/ui/locale-provider";
import { translateAdminText } from "@/i18n/admin-text";
import type { ProductFormData } from "@/types/catalog";

const locales = [
  { code: "ar", label: "العربية" },
  { code: "en", label: "English" },
  { code: "it", label: "Italiano" },
] as const;
const blankTranslation = (locale: "ar" | "en" | "it") => ({
  locale,
  name: "",
  description: "",
  ingredients_text: "",
  allergens_text: "",
});
const blankNutrition = {
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
};
const maxProductImageSize = 5 * 1024 * 1024;
const allowedProductImageTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

type Props = {
  categories: Array<{ id: string; name: string }>;
  initial?: ProductFormData;
  productMeta?: { createdAt: string; updatedAt: string };
};

export function ProductForm({ categories, initial, productMeta }: Props) {
  const router = useRouter();
  const { locale } = useLocale();
  const t = (value: string) => translateAdminText(locale, value);
  const [form, setForm] = useState<ProductFormData>(() => {
    const base = initial ?? {
      category_id: null,
      sku: "",
      is_active: true,
      availability_status: "hidden" as const,
      translations: [],
      prices: [],
      nutrition: blankNutrition,
    };
    return {
      ...base,
      translations: locales.map(
        ({ code }) =>
          base.translations.find((item) => item.locale === code) ?? blankTranslation(code),
      ),
    };
  });
  const [activeTranslationLocale, setActiveTranslationLocale] =
    useState<(typeof locales)[number]["code"]>("ar");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [productImage, setProductImage] = useState<string | null>(initial?.image_url ?? null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageError, setImageError] = useState("");

  useEffect(() => {
    return () => {
      if (productImage?.startsWith("blob:")) URL.revokeObjectURL(productImage);
    };
  }, [productImage]);
  const updateTranslation = (
    translationLocale: ProductFormData["translations"][number]["locale"],
    key: "name" | "description" | "ingredients_text" | "allergens_text",
    value: string,
  ) =>
    setForm((current) => ({
      ...current,
      translations: current.translations.map((item) =>
        item.locale === translationLocale ? { ...item, [key]: value } : item,
      ),
    }));
  const updatePrice = (index: number, patch: Partial<ProductFormData["prices"][number]>) =>
    setForm((current) => ({
      ...current,
      prices: current.prices.map((price, priceIndex) =>
        priceIndex === index ? { ...price, ...patch } : price,
      ),
    }));
  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const result = await saveProduct(form);
      if (!result.success || !result.productId) {
        setMessage(t(result.message));
        return;
      }
      if (selectedImage) {
        const imageResult = await saveProductImage(result.productId, selectedImage);
        setMessage(t(imageResult.message));
        if (!imageResult.success) return;
      } else {
        setMessage(t(result.message));
      }
      if (!form.id) router.push("/admin/products");
    } catch {
      setMessage(t("تعذر حفظ المنتج. حاول مرة أخرى."));
    } finally {
      setSaving(false);
    }
  }
  const title = form.translations.find((item) => item.locale === "ar")?.name || t("منتج جديد");
  const formatDate = (value?: string) =>
    value ? new Date(value).toLocaleString(locale === "ar" ? "ar-EG" : locale) : "—";

  return (
    <form id="product-edit-form" onSubmit={submit} className="grid gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-border)] pb-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/admin/products"
            aria-label={t("العودة إلى المنتجات")}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] text-xl text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface)]"
          >
            ←
          </Link>
          <div className="flex min-w-0 items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <span>{t("المنتجات")}</span>
            <span aria-hidden="true">›</span>
            <span className="truncate font-semibold text-[var(--color-text-primary)]">
              {t("تعديل المنتج")} — {title}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[var(--color-success)]/40 bg-[var(--color-success)]/10 px-3 py-2 text-xs font-semibold text-[var(--color-success)]">
            ● {form.is_active ? t("نشط في القائمة") : t("غير نشط")}
          </span>
          <Link
            href="/admin/products"
            className="inline-flex min-h-11 items-center rounded-[var(--radius-pill)] border border-[var(--color-border)] px-5 text-sm font-semibold transition hover:bg-[var(--color-surface)]"
          >
            {t("إلغاء")}
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? t("جارٍ الحفظ...") : t("حفظ المنتج")}
          </Button>
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.75fr)]">
        <div className="grid gap-6">
          <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold">{t("معلومات المنتج")}</h2>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {t("إدارة بيانات المنتج بكل اللغات المدعومة.")}
                </p>
              </div>
              <span className="hidden rounded-md bg-[var(--color-background-deep)] px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--color-brand-primary)] sm:inline-flex">
                {t("متعدد اللغات")}
              </span>
            </div>
            <div
              className="overflow-x-auto border-b border-[var(--color-border)]"
              role="tablist"
              aria-label={t("الترجمات")}
            >
              <div className="flex min-w-max">
                {locales.map((item) => (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTranslationLocale === item.code}
                    className={`border-b-2 px-6 py-4 text-sm font-semibold transition ${activeTranslationLocale === item.code ? "border-[var(--color-brand-primary)] text-[var(--color-brand-primary)]" : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"}`}
                    key={item.code}
                    onClick={() => setActiveTranslationLocale(item.code)}
                  >
                    {item.label}
                    {item.code === "ar" ? (
                      <span className="ms-2 rounded bg-[var(--color-danger)]/15 px-1.5 py-0.5 text-[0.6rem] text-[var(--color-danger)]">
                        {t("مطلوب")}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
            {(() => {
              const translation =
                form.translations.find((item) => item.locale === activeTranslationLocale) ??
                blankTranslation(activeTranslationLocale);
              return (
                <div className="grid gap-5 p-6">
                  <label className="grid gap-2 text-sm font-semibold">
                    {t("اسم المنتج")}
                    <Input
                      dir={activeTranslationLocale === "ar" ? "rtl" : "ltr"}
                      required={activeTranslationLocale === "ar"}
                      value={translation.name}
                      onChange={(event) =>
                        updateTranslation(activeTranslationLocale, "name", event.target.value)
                      }
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold">
                    {t("الوصف")}
                    <Textarea
                      dir={activeTranslationLocale === "ar" ? "rtl" : "ltr"}
                      value={translation.description}
                      onChange={(event) =>
                        updateTranslation(
                          activeTranslationLocale,
                          "description",
                          event.target.value,
                        )
                      }
                    />
                  </label>
                  <div className="grid gap-5 md:grid-cols-2">
                    <label className="grid gap-2 text-sm font-semibold">
                      {t("المكونات")}
                      <Textarea
                        dir={activeTranslationLocale === "ar" ? "rtl" : "ltr"}
                        value={translation.ingredients_text}
                        onChange={(event) =>
                          updateTranslation(
                            activeTranslationLocale,
                            "ingredients_text",
                            event.target.value,
                          )
                        }
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-semibold">
                      {t("مسببات الحساسية")}
                      <Textarea
                        dir={activeTranslationLocale === "ar" ? "rtl" : "ltr"}
                        value={translation.allergens_text}
                        onChange={(event) =>
                          updateTranslation(
                            activeTranslationLocale,
                            "allergens_text",
                            event.target.value,
                          )
                        }
                      />
                    </label>
                  </div>
                </div>
              );
            })()}
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">{t("الأسعار والخيارات")}</h2>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {t("إدارة أحجام المنتج وأسعاره الحالية.")}
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    prices: [
                      ...current.prices,
                      {
                        label: "",
                        price_egp: "",
                        compare_at_price_egp: "",
                        is_active: true,
                        valid_from: new Date().toISOString().slice(0, 16),
                        valid_until: "",
                      },
                    ],
                  }))
                }
              >
                {t("إضافة سعر")}
              </Button>
            </div>
            <div className="mt-6 overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)]">
              <div className="min-w-[760px]">
                <div className="grid grid-cols-[1.1fr_0.8fr_0.95fr_1fr_auto] gap-3 border-b border-[var(--color-border)] bg-[var(--color-background-deep)]/25 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  <span>{t("الحجم / الخيار")}</span>
                  <span>{t("السعر")}</span>
                  <span>{t("السعر الأصلي")}</span>
                  <span>{t("آخر تحديث")}</span>
                  <span>{t("إجراء")}</span>
                </div>
                <div className="grid gap-2 p-3">
                  {form.prices.map((price, index) => (
                    <div
                      className="grid grid-cols-[1.1fr_0.8fr_0.95fr_1fr_auto] items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-background)] p-3"
                      key={price.id ?? index}
                    >
                      <Input
                        aria-label={t("اسم السعر")}
                        placeholder={t("اسم الخيار")}
                        value={price.label}
                        onChange={(event) => updatePrice(index, { label: event.target.value })}
                      />
                      <Input
                        aria-label={t("السعر بالجنيه")}
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="EGP"
                        value={price.price_egp}
                        onChange={(event) => updatePrice(index, { price_egp: event.target.value })}
                      />
                      <Input
                        aria-label={t("السعر الأصلي قبل الخصم")}
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder={t("اختياري")}
                        value={price.compare_at_price_egp ?? ""}
                        onChange={(event) =>
                          updatePrice(index, { compare_at_price_egp: event.target.value })
                        }
                      />
                      <Input
                        aria-label={t("يبدأ من")}
                        type="datetime-local"
                        value={price.valid_from}
                        onChange={(event) => updatePrice(index, { valid_from: event.target.value })}
                      />
                      <button
                        type="button"
                        className="rounded-[var(--radius-sm)] px-2 text-sm text-[var(--color-danger)]"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            prices: current.prices.filter((_, itemIndex) => itemIndex !== index),
                          }))
                        }
                      >
                        {t("حذف")}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">{t("المعلومات الغذائية")}</h2>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {t("كل الحقول اختيارية. أضف القيم المؤكدة فقط.")}
                </p>
              </div>
              <span className="rounded-full bg-[var(--color-background-deep)] px-3 py-2 text-xs font-semibold text-[var(--color-brand-primary)]">
                {t("قيم مؤكدة")}
              </span>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(
                [
                  ["serving_size", "حجم الحصة"],
                  ["calories", "السعرات"],
                  ["protein_g", "البروتين"],
                  ["carbohydrates_g", "الكربوهيدرات"],
                  ["sugars_g", "السكريات"],
                  ["total_fat_g", "إجمالي الدهون"],
                  ["saturated_fat_g", "الدهون المشبعة"],
                  ["trans_fat_g", "الدهون المتحولة"],
                  ["fiber_g", "الألياف"],
                  ["cholesterol_mg", "الكوليسترول"],
                ] as const
              ).map(([key, label]) => (
                <label className="grid gap-2 text-sm font-semibold" key={key}>
                  {t(label)}
                  <Input
                    type={key === "serving_size" ? "text" : "number"}
                    step="0.01"
                    value={form.nutrition[key] ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        nutrition: {
                          ...current.nutrition,
                          [key]: event.target.value === "" ? null : event.target.value,
                        },
                      }))
                    }
                  />
                </label>
              ))}
            </div>
            <label className="mt-5 grid gap-2 text-sm font-semibold">
              {t("ملاحظات")}
              <Textarea
                value={form.nutrition.notes ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    nutrition: { ...current.nutrition, notes: event.target.value },
                  }))
                }
              />
            </label>
          </section>
        </div>

        <aside className="grid gap-6 lg:sticky lg:top-6">
          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">{t("وسائط المنتج")}</h2>
              <span className="text-xs text-[var(--color-text-muted)]">{t("الصورة الرئيسية")}</span>
            </div>
            <div className="mt-5 grid gap-4">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)]">
                {productImage ? (
                  <Image
                    src={productImage}
                    alt={title}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-center text-[var(--color-text-muted)]">
                    <div>
                      <span className="mb-3 block text-4xl text-[var(--color-brand-primary)]">◇</span>
                      <p className="text-sm font-semibold">{t("رفع صورة المنتج")}</p>
                    </div>
                  </div>
                )}
              </div>
              <label className="grid cursor-pointer gap-2 rounded-[var(--radius-md)] border-2 border-dashed border-[var(--color-border)] bg-[var(--color-background)] p-5 text-center transition hover:border-[var(--color-brand-primary)]">
                <span className="text-sm font-semibold">
                  {t(productImage ? "استبدال الصورة" : "اختيار صورة")}
                </span>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {t("PNG أو JPG أو WEBP · بحد أقصى 5 ميجابايت")}
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    if (!allowedProductImageTypes.has(file.type) || file.size > maxProductImageSize) {
                      setImageError(t("صورة المنتج يجب أن تكون PNG أو JPG أو WEBP وبحد أقصى 5 ميجابايت."));
                      event.target.value = "";
                      return;
                    }
                    setImageError("");
                    setSelectedImage(file);
                    setProductImage(URL.createObjectURL(file));
                  }}
                />
              </label>
              {imageError ? (
                <p className="text-xs text-[var(--color-danger)]" role="alert">
                  {imageError}
                </p>
              ) : null}
            </div>
          </section>
          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-xl font-semibold">{t("الحالة والتصنيف")}</h2>
            <div className="mt-5 grid gap-5">
              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] p-4 text-sm font-semibold">
                <span>
                  <span className="block">{t("المنتج نشط")}</span>
                  <span className="mt-1 block text-xs font-normal text-[var(--color-text-muted)]">
                    {t("ظاهر للطلب عبر الإنترنت")}
                  </span>
                </span>
                <input
                  type="checkbox"
                  className="size-5 accent-[var(--color-brand-primary)]"
                  checked={form.is_active}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, is_active: event.target.checked }))
                  }
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                {t("التصنيف")}
                <Select
                  value={form.category_id ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, category_id: event.target.value || null }))
                  }
                >
                  <option value="">{t("بدون تصنيف")}</option>
                  {categories.map((category) => (
                    <option value={category.id} key={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                {t("رمز المنتج (اختياري)")}
                <Input
                  value={form.sku}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, sku: event.target.value }))
                  }
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                {t("الحالة")}
                <Select
                  value={form.availability_status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      availability_status: event.target
                        .value as ProductFormData["availability_status"],
                    }))
                  }
                >
                  <option value="available">{t("متاح")}</option>
                  <option value="out_of_stock">{t("نفد")}</option>
                  <option value="hidden">{t("مخفي")}</option>
                </Select>
              </label>
            </div>
          </section>
          {productMeta ? (
            <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                {t("تفاصيل المراجعة")}
              </h2>
              <dl className="mt-5 grid gap-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--color-text-muted)]">{t("آخر تحديث")}</dt>
                  <dd className="text-right font-semibold">{formatDate(productMeta.updatedAt)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--color-text-muted)]">{t("تاريخ الإنشاء")}</dt>
                  <dd className="text-right font-semibold">{formatDate(productMeta.createdAt)}</dd>
                </div>
              </dl>
            </section>
          ) : null}
        </aside>
      </div>
      {message ? (
        <p
          className="rounded-[var(--radius-sm)] bg-[rgba(94,118,93,0.08)] p-3 text-sm"
          role="status"
        >
          {message}
        </p>
      ) : null}
      <div className="flex flex-wrap justify-end gap-3 border-t border-[var(--color-border)] pt-5">
        <Link
          className="inline-flex min-h-11 items-center rounded-[var(--radius-pill)] border border-[var(--color-border)] px-5 text-sm font-semibold"
          href="/admin/products"
        >
          {t("إلغاء")}
        </Link>
        <Button type="submit" disabled={saving}>
          {saving ? t("جارٍ الحفظ...") : t("حفظ المنتج")}
        </Button>
      </div>
    </form>
  );
}
