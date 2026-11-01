"use client";
import { useState } from "react";
import { saveInventoryItem } from "@/lib/inventory/actions";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/ui/locale-provider";
import { translateAdminText } from "@/i18n/admin-text";
const units = ["piece", "gram", "kilogram", "milliliter", "liter", "box", "pack", "bag"];
export function InventoryItemForm() {
  const { locale } = useLocale();
  const t = (value: string) => translateAdminText(locale, value);
  const [form, setForm] = useState({
    name_ar: "",
    name_en: "",
    name_it: "",
    item_type: "ingredient" as "ingredient" | "packaging" | "finished_product",
    sku: "",
    unit: "piece",
    low_stock_threshold: 0,
  });
  const [message, setMessage] = useState("");
  return (
    <form
      className="grid gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
      action={async () => setMessage((await saveInventoryItem(form)).message)}
    >
      <label className="grid gap-2 text-sm font-semibold">
        {locale === "ar" ? "الاسم بالعربية" : locale === "it" ? "Nome arabo" : "Arabic name"}
        <Input
          required
          value={form.name_ar}
          onChange={(event) => setForm({ ...form, name_ar: event.target.value })}
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        English
        <Input
          value={form.name_en}
          onChange={(event) => setForm({ ...form, name_en: event.target.value })}
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Italiano
        <Input
          value={form.name_it}
          onChange={(event) => setForm({ ...form, name_it: event.target.value })}
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        {t("النوع")}
        <Select
          value={form.item_type}
          onChange={(event) =>
            setForm({ ...form, item_type: event.target.value as typeof form.item_type })
          }
        >
          <option value="ingredient">
            {locale === "ar" ? "مكوّن" : locale === "it" ? "Ingrediente" : "Ingredient"}
          </option>
          <option value="packaging">
            {locale === "ar" ? "تغليف" : locale === "it" ? "Imballaggio" : "Packaging"}
          </option>
          <option value="finished_product">
            {locale === "ar"
              ? "منتج نهائي"
              : locale === "it"
                ? "Prodotto finito"
                : "Finished product"}
          </option>
        </Select>
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        {locale === "ar" ? "الوحدة" : locale === "it" ? "Unità" : "Unit"}
        <Select
          value={form.unit}
          onChange={(event) => setForm({ ...form, unit: event.target.value })}
        >
          {units.map((unit) => (
            <option value={unit} key={unit}>
              {unit}
            </option>
          ))}
        </Select>
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        {locale === "ar"
          ? "حد المخزون المنخفض"
          : locale === "it"
            ? "Soglia scorte basse"
            : "Low stock threshold"}
        <Input
          type="number"
          min="0"
          step="0.001"
          value={form.low_stock_threshold}
          onChange={(event) =>
            setForm({ ...form, low_stock_threshold: Number(event.target.value) })
          }
        />
      </label>
      {message ? (
        <p role="status" className="text-sm">
          {message}
        </p>
      ) : null}
      <Button>
        {locale === "ar" ? "حفظ العنصر" : locale === "it" ? "Salva articolo" : "Save item"}
      </Button>
    </form>
  );
}
