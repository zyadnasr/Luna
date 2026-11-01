"use client";

import Link from "next/link";
import { useCart } from "./cart-provider";
import { useLocale } from "@/components/ui/locale-provider";
import { getPublicCopy, localizePriceLabel } from "@/i18n/public";

export function CheckoutSummary() {
  const { items, setQuantity, remove, clear } = useCart();
  const { locale } = useLocale();
  const t = getPublicCopy(locale);
  const subtotal = items.reduce((sum, item) => sum + (item.unitPrice ?? 0) * item.quantity, 0);
  const numberLocale = locale === "ar" ? "ar-EG" : locale === "it" ? "it-IT" : "en-EG";

  return (
    <section className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] sm:p-7">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[var(--color-brand-primary)]">{t.yourOrder}</p>
          <h2 className="mt-1 text-2xl font-bold">{t.cart}</h2>
        </div>
        {items.length ? (
          <button type="button" onClick={clear} className="text-sm text-[var(--color-text-muted)]">
            {t.clearCart}
          </button>
        ) : null}
      </div>
      {!items.length ? (
        <div className="py-16 text-center">
          <p className="text-3xl" aria-hidden="true">
            ◌
          </p>
          <p className="mt-4 font-semibold">{t.emptyCart}</p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">{t.emptyCartHint}</p>
          <Link
            href="/order"
            className="mt-6 inline-flex font-semibold text-[var(--color-brand-primary)]"
          >
            {t.continueOrder}
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-7 divide-y divide-[var(--color-border)]">
            {items.map((item) => (
              <div className="flex gap-3 py-4" key={`${item.productId}-${item.priceId}`}>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {item.productNameByLocale?.[locale] ?? item.productName ?? t.product}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    {localizePriceLabel(item.priceLabel, locale) || t.priceShort} ·{" "}
                    {(item.unitPrice ?? 0).toLocaleString(numberLocale)} {t.egp}
                  </p>
                  <div className="mt-3 inline-flex items-center rounded-full border border-[var(--color-border)]">
                    <button
                      type="button"
                      className="grid size-8 place-items-center"
                      aria-label={t.increaseQuantity}
                      onClick={() => setQuantity(item.productId, item.priceId, item.quantity + 1)}
                    >
                      +
                    </button>
                    <span className="w-7 text-center text-sm">{item.quantity}</span>
                    <button
                      type="button"
                      className="grid size-8 place-items-center"
                      aria-label={t.decreaseQuantity}
                      onClick={() => setQuantity(item.productId, item.priceId, item.quantity - 1)}
                    >
                      −
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  className="self-start text-xs text-[var(--color-danger)]"
                  onClick={() => remove(item.productId, item.priceId)}
                >
                  {t.remove}
                </button>
              </div>
            ))}
          </div>
          <div className="mt-5 border-t border-[var(--color-border)] pt-5">
            <div className="flex items-center justify-between font-bold">
              <span>{t.subtotal}</span>
              <span>
                {subtotal.toLocaleString(numberLocale)} {t.egp}
              </span>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
