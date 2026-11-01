"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { saveProduct } from "@/lib/catalog/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ProductFormData } from "@/types/catalog";
import { useLocale } from "@/components/ui/locale-provider";
import { translateAdminText } from "@/i18n/admin-text";

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

export function ProductForm({
  categories,
  initial,
}: {
  categories: Array<{ id: string; name: string }>;
  initial?: ProductFormData;
}) {
  const router = useRouter();
  const { locale } = useLocale();
  const t = (value: string) => translateAdminText(locale, value);
  const [form, setForm] = useState<ProductFormData>(
    initial ?? {
      category_id: null,
      sku: "",
      is_active: true,
      availability_status: "hidden",
      translations: locales.map(({ code }) => blankTranslation(code)),
      prices: [],
      nutrition: blankNutrition,
    },
  );
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const updateTranslation = (
    locale: ProductFormData["translations"][number]["locale"],
    key: "name" | "description" | "ingredients_text" | "allergens_text",
    value: string,
  ) =>
    setForm((current) => ({
      ...current,
      translations: current.translations.map((item) =>
        item.locale === locale ? { ...item, [key]: value } : item,
      ),
    }));
  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    const result = await saveProduct(form);
    setMessage(result.message);
    setSaving(false);
    if (result.success && !form.id) router.push("/admin/products");
  }
  return (
    <form onSubmit={submit} className="grid gap-8">
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
        <h2 className="text-xl font-semibold">{t("المعلومات الأساسية")}</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">
            {t("التصنيف")}
            <Select
              value={form.category_id ?? ""}
              onChange={(event) => setForm({ ...form, category_id: event.target.value || null })}
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
              onChange={(event) => setForm({ ...form, sku: event.target.value })}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            {t("الحالة")}
            <Select
              value={form.availability_status}
              onChange={(event) =>
                setForm({
                  ...form,
                  availability_status: event.target.value as ProductFormData["availability_status"],
                })
              }
            >
              <option value="available">
                {t("متاح")} ·{" "}
                {locale === "ar"
                  ? "يظهر وقابل للطلب لاحقًا"
                  : locale === "it"
                    ? "visibile e ordinabile"
                    : "visible and orderable later"}
              </option>
              <option value="out_of_stock">
                {t("نفد")} ·{" "}
                {locale === "ar"
                  ? "يظهر كغير متاح"
                  : locale === "it"
                    ? "visibile come non disponibile"
                    : "shown as unavailable"}
              </option>
              <option value="hidden">
                {t("مخفي")} ·{" "}
                {locale === "ar"
                  ? "لا يظهر في القائمة"
                  : locale === "it"
                    ? "non visibile nel menu"
                    : "hidden from the menu"}
              </option>
            </Select>
          </label>
          <label className="flex items-center gap-3 self-end text-sm font-semibold">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
            />{" "}
            {t("المنتج نشط")}
          </label>
        </div>
      </section>
      {locales.map((locale) => {
        const translation =
          form.translations.find((item) => item.locale === locale.code) ??
          blankTranslation(locale.code);
        return (
          <section
            className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]"
            key={locale.code}
          >
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-xl font-semibold">
                {t("معلومات")} {locale.label}
              </h2>
              <span className="text-xs text-[var(--color-text-muted)]">
                {locale.code === "ar" ? t("مطلوب") : t("اختياري")}
              </span>
            </div>
            <div className="mt-6 grid gap-5">
              <label className="grid gap-2 text-sm font-semibold">
                {t("اسم المنتج")}
                <Input
                  required={locale.code === "ar"}
                  value={translation.name}
                  onChange={(event) => updateTranslation(locale.code, "name", event.target.value)}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                {t("الوصف")}
                <Textarea
                  value={translation.description}
                  onChange={(event) =>
                    updateTranslation(locale.code, "description", event.target.value)
                  }
                />
              </label>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold">
                  {t("المكونات")}
                  <Textarea
                    value={translation.ingredients_text}
                    onChange={(event) =>
                      updateTranslation(locale.code, "ingredients_text", event.target.value)
                    }
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold">
                  {t("مسببات الحساسية")}
                  <Textarea
                    value={translation.allergens_text}
                    onChange={(event) =>
                      updateTranslation(locale.code, "allergens_text", event.target.value)
                    }
                  />
                </label>
              </div>
            </div>
          </section>
        );
      })}
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{t("الأسعار والخيارات")}</h2>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              {t("أضف الأسعار الحقيقية يدويًا. لا توجد خيارات مضافة تلقائيًا.")}
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              setForm({
                ...form,
                prices: [
                  ...form.prices,
                  {
                    label: "",
                    price_egp: "",
                    is_active: true,
                    valid_from: new Date().toISOString().slice(0, 16),
                    valid_until: "",
                  },
                ],
              })
            }
          >
            {t("إضافة سعر")}
          </Button>
        </div>
        <div className="mt-6 grid gap-4">
          {form.prices.map((price, index) => (
            <div
              className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] p-4 md:grid-cols-[1fr_140px_1fr_auto]"
              key={price.id ?? index}
            >
              <Input
                aria-label={t("اسم السعر")}
                placeholder={t("اسم الخيار")}
                value={price.label}
                onChange={(event) => {
                  const prices = [...form.prices];
                  prices[index] = { ...price, label: event.target.value };
                  setForm({ ...form, prices });
                }}
              />
              <Input
                aria-label={t("السعر بالجنيه")}
                type="number"
                min="0.01"
                step="0.01"
                placeholder="EGP"
                value={price.price_egp}
                onChange={(event) => {
                  const prices = [...form.prices];
                  prices[index] = { ...price, price_egp: event.target.value };
                  setForm({ ...form, prices });
                }}
              />
              <Input
                aria-label={t("يبدأ من")}
                type="datetime-local"
                value={price.valid_from}
                onChange={(event) => {
                  const prices = [...form.prices];
                  prices[index] = { ...price, valid_from: event.target.value };
                  setForm({ ...form, prices });
                }}
              />
              <button
                type="button"
                className="rounded-[var(--radius-sm)] px-3 text-sm text-[var(--color-danger)]"
                onClick={() =>
                  setForm({
                    ...form,
                    prices: form.prices.filter((_, itemIndex) => itemIndex !== index),
                  })
                }
              >
                {t("حذف")}
              </button>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
        <h2 className="text-xl font-semibold">{t("المعلومات الغذائية")}</h2>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          {t("كل الحقول اختيارية. أضف القيم المؤكدة فقط.")}
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              ["source_image_path", "مسار صورة المصدر"],
            ] as const
          ).map(([key, label]) => (
            <label className="grid gap-2 text-sm font-semibold" key={key}>
              {t(label)}
              <Input
                type={key === "serving_size" || key === "source_image_path" ? "text" : "number"}
                step="0.01"
                value={form.nutrition[key] ?? ""}
                onChange={(event) =>
                  setForm({
                    ...form,
                    nutrition: {
                      ...form.nutrition,
                      [key]: event.target.value === "" ? null : event.target.value,
                    },
                  })
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
              setForm({ ...form, nutrition: { ...form.nutrition, notes: event.target.value } })
            }
          />
        </label>
      </section>
      {message ? (
        <p
          className="rounded-[var(--radius-sm)] bg-[rgba(94,118,93,0.08)] p-3 text-sm"
          role="status"
        >
          {message}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? t("جارٍ الحفظ...") : t("حفظ المنتج")}
        </Button>
        <Link
          className="inline-flex min-h-11 items-center rounded-[var(--radius-pill)] border border-[var(--color-border)] px-5 text-sm font-semibold"
          href="/admin/products"
        >
          {t("إلغاء")}
        </Link>
      </div>
    </form>
  );
}
