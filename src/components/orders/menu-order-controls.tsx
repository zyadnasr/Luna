"use client";
import { useState } from "react";
import { useCart } from "./cart-provider";
import { useLocale } from "@/components/ui/locale-provider";
import { getPublicCopy } from "@/i18n/public";
import { localizePriceLabel } from "@/i18n/public";
import type { Locale } from "@/config/site";
export function MenuOrderControls({
  productId,
  prices,
  productName,
  productNames,
  availabilityByPriceId,
}: {
  productId: string;
  prices: Array<{ id: string; label: string | null; price_egp: number }>;
  productName?: string;
  productNames?: Partial<Record<Locale, string>>;
  availabilityByPriceId?: Record<string, boolean>;
}) {
  const { add } = useCart();
  const { locale } = useLocale();
  const t = getPublicCopy(locale);
  const [priceId, setPriceId] = useState(prices[0]?.id ?? "");
  const [added, setAdded] = useState(false);
  const selected = prices.find((price) => price.id === priceId);
  const selectedAvailable = selected ? availabilityByPriceId?.[selected.id] !== false : false;
  if (!prices.length)
    return <p className="mt-4 text-xs text-[var(--color-text-muted)]">{t.noPrice}</p>;
  return (
    <div className="mt-4 border-t border-[var(--color-border)] pt-3 sm:mt-5 sm:pt-4">
      <select
        aria-label={
          locale === "ar"
            ? "اختيار الحجم أو السعر"
            : locale === "it"
              ? "Scegli formato o prezzo"
              : "Choose size or price"
        }
        value={priceId}
        onChange={(event) => setPriceId(event.target.value)}
        className="min-h-10 w-full min-w-0 rounded-[var(--radius-pill)] border border-[var(--glass-border)] bg-[var(--color-surface-focus)] px-3 py-2 text-[11px] leading-5 text-[var(--color-text-primary)] shadow-[inset_0_1px_0_var(--glass-highlight)] outline-none transition focus:border-[var(--color-brand-primary)] sm:text-xs"
      >
        {prices.map((price) => (
          <option
            value={price.id}
            key={price.id}
            disabled={availabilityByPriceId?.[price.id] === false}
          >
            {localizePriceLabel(price.label, locale) || t.price} ·{" "}
            {price.price_egp.toLocaleString(locale === "ar" ? "ar-EG" : "en-EG")} {t.egp}
            {availabilityByPriceId?.[price.id] === false ? ` · ${t.unavailable}` : ""}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={!selectedAvailable}
        className="mt-2 min-h-10 w-full rounded-[var(--radius-pill)] bg-[var(--color-brand-secondary)] px-2 text-[11px] font-semibold text-[var(--color-on-brand)] transition hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:mt-3 sm:px-4 sm:text-xs"
        onClick={() => {
          if (selected && selectedAvailable) {
            add({
              productId,
              priceId: selected.id,
              quantity: 1,
              productName,
              productNameByLocale: productNames,
              priceLabel: selected.label,
              unitPrice: selected.price_egp,
            });
            setAdded(true);
          }
        }}
      >
        {added ? t.addedToCart : t.addToCart}
      </button>
    </div>
  );
}
