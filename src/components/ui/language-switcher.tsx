"use client";

import type { Locale } from "@/config/site";
import { Select } from "./select";
import { useLocale } from "./locale-provider";

const languages: Array<{ code: Locale; label: string }> = [
  { code: "ar", label: "العربية" },
  { code: "en", label: "English" },
  { code: "it", label: "Italiano" },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  function handleChange(nextLocale: Locale) {
    setLocale(nextLocale);
  }
  return (
    <label className="flex items-center gap-2 text-sm" htmlFor="language-select">
      <span className="sr-only">اختيار اللغة</span>
      <Select
        id="language-select"
        value={locale}
        onChange={(event) => handleChange(event.target.value as Locale)}
        aria-label="اختيار اللغة"
        className="min-h-10 w-auto rounded-[var(--radius-pill)] border-[var(--color-border)] bg-[var(--color-surface)] py-1 ps-3 pe-8 text-xs font-semibold"
      >
        <option value="ar">{languages[0].label}</option>
        <option value="en">{languages[1].label}</option>
        <option value="it">{languages[2].label}</option>
      </Select>
    </label>
  );
}
