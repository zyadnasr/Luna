"use client";
import { useState } from "react";
import { useCart } from "./cart-provider";
import { useLocale } from "@/components/ui/locale-provider";
import { getPublicCopy } from "@/i18n/public";
export function MenuOrderControls({
  productId,
  prices,
  productName,
  availabilityByPriceId,
}: {
  productId: string;
  prices: Array<{ id: string; label: string | null; price_egp: number }>;
  productName?: string;
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
    <div className="mt-5 border-t border-[var(--color-border)] pt-4">
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
        className="min-h-10 w-full rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-xs"
      >
        {prices.map((price) => (
          <option
            value={price.id}
            key={price.id}
            disabled={availabilityByPriceId?.[price.id] === false}
          >
            {price.label ?? t.price} ·{" "}
            {price.price_egp.toLocaleString(locale === "ar" ? "ar-EG" : "en-EG")} {t.egp}
            {availabilityByPriceId?.[price.id] === false ? ` · ${t.unavailable}` : ""}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={!selectedAvailable}
        className="mt-3 min-h-10 w-full rounded-[var(--radius-pill)] bg-[var(--color-brand-secondary)] px-4 text-xs font-semibold text-[var(--color-on-brand)] disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => {
          if (selected && selectedAvailable) {
            add({
              productId,
              priceId: selected.id,
              quantity: 1,
              productName,
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
