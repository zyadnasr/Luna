"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/orders/cart-provider";
import { useLocale } from "@/components/ui/locale-provider";
import { getPublicCopy, localizePriceLabel } from "@/i18n/public";
import type { Locale } from "@/config/site";

type ProductOrderPanelProps = {
  productId: string;
  productName?: string;
  productNames: Partial<Record<Locale, string>>;
  prices: Array<{
    id: string;
    label: string | null;
    price_egp: number;
    compare_at_price_egp?: number | null;
  }>;
  availabilityByPriceId: Record<string, boolean>;
  available: boolean;
};

export function ProductOrderPanel({
  productId,
  productName,
  productNames,
  prices,
  availabilityByPriceId,
  available,
}: ProductOrderPanelProps) {
  const { add } = useCart();
  const { locale } = useLocale();
  const t = getPublicCopy(locale);
  const [priceId, setPriceId] = useState(prices[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const selected = prices.find((price) => price.id === priceId);
  const selectedAvailable = Boolean(
    available && selected && availabilityByPriceId[selected.id] !== false,
  );
  const formatPrice = (value: number) =>
    `${value.toLocaleString(locale === "ar" ? "ar-EG" : "en-EG")} ${t.egp}`;

  if (!prices.length) {
    return <p className="text-sm text-[var(--color-text-muted)]">{t.noPrice}</p>;
  }

  function addToCart() {
    if (!selected || !selectedAvailable) return;
    add({
      productId,
      priceId: selected.id,
      quantity,
      productName,
      productNameByLocale: productNames,
      priceLabel: selected.label,
      unitPrice: selected.price_egp,
    });
    setAdded(true);
  }

  return (
    <div className="grid gap-5 rounded-[1.5rem] border border-[var(--glass-border)] bg-[var(--color-surface-glass)] p-5 shadow-[var(--shadow-card)] sm:p-6">
      <div>
        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
          {t.selectOption}
        </label>
        <select
          aria-label={t.selectOption}
          value={priceId}
          onChange={(event) => {
            setPriceId(event.target.value);
            setAdded(false);
          }}
          className="mt-2 min-h-12 w-full rounded-[var(--radius-pill)] border border-[var(--glass-border)] bg-[var(--color-surface-focus)] px-4 text-sm outline-none transition focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-focus-ring)]"
        >
          {prices.map((price) => (
            <option
              key={price.id}
              value={price.id}
              disabled={availabilityByPriceId[price.id] === false || !available}
            >
              {localizePriceLabel(price.label, locale) || t.price} · {formatPrice(price.price_egp)}
            </option>
          ))}
        </select>
      </div>

      {selected ? (
        <div className="flex items-baseline justify-between gap-4 border-y border-[var(--color-border)] py-4">
          <span className="text-sm text-[var(--color-text-muted)]">
            {localizePriceLabel(selected.label, locale) || t.price}
          </span>
          <span className="flex flex-wrap items-baseline justify-end gap-2 text-xl font-bold tabular-nums">
            {selected.compare_at_price_egp && selected.compare_at_price_egp > selected.price_egp ? (
              <span className="text-sm font-medium text-[var(--color-text-muted)] line-through">
                {formatPrice(selected.compare_at_price_egp)}
              </span>
            ) : null}
            {formatPrice(selected.price_egp)}
          </span>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-semibold">{t.quantity}</span>
        <div className="flex items-center rounded-[var(--radius-pill)] border border-[var(--glass-border)] bg-[var(--color-surface-focus)] p-1">
          <button
            type="button"
            aria-label={t.decreaseQuantity}
            className="grid size-9 place-items-center rounded-full text-lg transition hover:bg-[var(--color-surface)] disabled:opacity-40"
            disabled={quantity <= 1}
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
          >
            −
          </button>
          <span className="min-w-9 text-center text-sm font-bold tabular-nums">{quantity}</span>
          <button
            type="button"
            aria-label={t.increaseQuantity}
            className="grid size-9 place-items-center rounded-full text-lg transition hover:bg-[var(--color-surface)] disabled:opacity-40"
            disabled={quantity >= 99}
            onClick={() => setQuantity((current) => Math.min(99, current + 1))}
          >
            +
          </button>
        </div>
      </div>

      <button
        type="button"
        disabled={!selectedAvailable}
        onClick={addToCart}
        className="min-h-12 w-full rounded-[var(--radius-pill)] bg-[var(--color-brand-secondary)] px-5 text-sm font-semibold text-[var(--color-on-brand)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {selectedAvailable ? (added ? t.addedToCart : t.addToCart) : t.soldOut}
      </button>

      {added ? (
        <Link
          href="/checkout"
          className="text-center text-sm font-semibold text-[var(--color-brand-primary)] underline"
        >
          {t.continueOrder}
        </Link>
      ) : null}
    </div>
  );
}
