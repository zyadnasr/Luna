"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveCategory, deleteCategory, reorderCategories } from "@/lib/catalog/category-actions";
import type { CategoryWithTranslations } from "@/types/catalog";
import { useLocale } from "@/components/ui/locale-provider";
import { translateAdminText } from "@/i18n/admin-text";

function name(category: CategoryWithTranslations, locale: string) {
  return category.category_translations.find((item) => item.locale === locale)?.name ?? "";
}
export function CategoryManager({ initial }: { initial: CategoryWithTranslations[] }) {
  const { locale } = useLocale();
  const t = (value: string) => translateAdminText(locale, value);
  const [categories, setCategories] = useState(initial);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState({ ar: "", en: "", it: "", slug: "", is_active: true });
  function start(category?: CategoryWithTranslations) {
    setEditing(category?.id ?? "new");
    setDraft({
      ar: category ? name(category, "ar") : "",
      en: category ? name(category, "en") : "",
      it: category ? name(category, "it") : "",
      slug: category?.slug ?? "",
      is_active: category?.is_active ?? true,
    });
  }
  async function save() {
    const result = await saveCategory({
      id: editing === "new" ? undefined : (editing ?? undefined),
      slug: draft.slug || draft.ar.toLowerCase().replace(/\s+/g, "-"),
      is_active: draft.is_active,
      sort_order: categories.find((item) => item.id === editing)?.sort_order ?? categories.length,
      names: draft,
    });
    setMessage(result.message);
    if (result.success) window.location.reload();
  }
  async function remove(id: string) {
    if (
      !window.confirm(
        locale === "ar"
          ? "هل تريد حذف هذا التصنيف؟"
          : locale === "it"
            ? "Vuoi eliminare questa categoria?"
            : "Delete this category?",
      )
    )
      return;
    const result = await deleteCategory(id);
    setMessage(result.message);
    if (result.success) setCategories(categories.filter((category) => category.id !== id));
  }
  async function move(index: number, direction: -1 | 1) {
    const next = [...categories];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setCategories(next);
    const result = await reorderCategories(next.map((category) => category.id));
    setMessage(result.message);
  }
  return (
    <div>
      <div className="flex justify-end">
        <Button onClick={() => start()}>{t("إضافة تصنيف")}</Button>
      </div>
      {message ? (
        <p className="mt-4 text-sm text-[var(--color-text-muted)]" role="status">
          {message}
        </p>
      ) : null}
      {editing ? (
        <div className="mt-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="text-xl font-semibold">
            {editing === "new" ? t("تصنيف جديد") : t("تعديل التصنيف")}
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">
              {t("العربية")}
              <Input
                value={draft.ar}
                onChange={(event) => setDraft({ ...draft, ar: event.target.value })}
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              English
              <Input
                value={draft.en}
                onChange={(event) => setDraft({ ...draft, en: event.target.value })}
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Italiano
              <Input
                value={draft.it}
                onChange={(event) => setDraft({ ...draft, it: event.target.value })}
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              {t("المعرّف")}
              <Input
                value={draft.slug}
                onChange={(event) => setDraft({ ...draft, slug: event.target.value })}
              />
            </label>
          </div>
          <div className="mt-5 flex gap-3">
            <Button onClick={save}>{t("حفظ")}</Button>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              {t("إلغاء")}
            </Button>
          </div>
        </div>
      ) : null}
      <div className="mt-6 grid gap-3">
        {categories.map((category, index) => (
          <div
            className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]"
            key={category.id}
          >
            <div>
              <p className="font-semibold">{name(category, "ar") || category.slug}</p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                {name(category, "en") || t("بدون ترجمة إنجليزية")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs"
                onClick={() => move(index, -1)}
              >
                ↑
              </button>
              <button
                type="button"
                className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs"
                onClick={() => move(index, 1)}
              >
                ↓
              </button>
              <button
                type="button"
                className="px-2 text-sm font-semibold"
                onClick={() => start(category)}
              >
                {t("تعديل")}
              </button>
              <button
                type="button"
                className="px-2 text-sm text-[var(--color-danger)]"
                onClick={() => remove(category.id)}
              >
                {t("حذف")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
