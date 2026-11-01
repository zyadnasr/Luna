"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useCart } from "./cart-provider";
import { useLocale } from "@/components/ui/locale-provider";
import { getPublicCopy, localizePriceLabel } from "@/i18n/public";

export function CartDrawer({ contextLabel }: { contextLabel?: string }) {
  const { items, setQuantity, remove, clear } = useCart();
  const { locale } = useLocale();
  const t = getPublicCopy(locale);
  const [open, setOpen] = useState(false);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + (item.unitPrice ?? 0) * item.quantity, 0);
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);
  return (
    <>
      <Link
        href={contextLabel ? "#" : "/checkout"}
        aria-label={`${t.cart}, ${count}`}
        aria-expanded={contextLabel ? open : undefined}
        onClick={(event) => {
          if (contextLabel) {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className="luna-glass relative grid size-11 place-items-center rounded-full border text-[var(--color-text-primary)] transition hover:-translate-y-0.5 active:scale-95"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-[1.25rem] fill-none stroke-current stroke-[1.8]"
        >
          <path d="M6.5 8.5h11l-.7 11H7.2z" />
          <path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" />
          <path d="M9.5 12v4M14.5 12v4" />
        </svg>
        {count ? (
          <span className="absolute -end-1 -top-1 grid min-w-5 place-items-center rounded-full bg-[var(--color-brand-secondary)] px-1 text-[10px] font-bold text-[var(--color-on-brand)]">
            {count}
          </span>
        ) : null}
      </Link>
      {contextLabel && open && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[80]"
              role="dialog"
              aria-modal="true"
              aria-label={t.cart}
            >
              <button
                className="absolute inset-0 bg-[rgba(48,40,32,0.28)]"
                aria-label={t.close}
                onClick={() => setOpen(false)}
              />
              <aside className="luna-glass absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto rounded-t-[2rem] border p-5 md:inset-y-0 md:start-auto md:w-[min(28rem,92vw)] md:rounded-none md:rounded-s-[2rem] md:p-7">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-[var(--color-brand-primary)]">
                      {t.yourOrder}
                    </p>
                    <h2 className="mt-1 text-2xl font-bold">{t.cart}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="grid size-10 place-items-center rounded-full border border-[var(--color-border)]"
                    aria-label={t.close}
                  >
                    ×
                  </button>
                </div>
                {contextLabel ? (
                  <p className="mt-4 rounded-xl bg-[var(--color-background-deep)] px-3 py-2 text-xs text-[var(--color-text-secondary)]">
                    {contextLabel}
                  </p>
                ) : null}
                {!items.length ? (
                  <div className="py-16 text-center">
                    <p className="text-3xl" aria-hidden="true">
                      ◌
                    </p>
                    <p className="mt-4 font-semibold">{t.emptyCart}</p>
                    <p className="mt-2 text-sm text-[var(--color-text-muted)]">{t.emptyCartHint}</p>
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
                              {(item.unitPrice ?? 0).toLocaleString(
                                locale === "ar" ? "ar-EG" : "en-EG",
                              )}{" "}
                              {t.egp}
                            </p>
                            <div className="mt-3 inline-flex items-center rounded-full border border-[var(--color-border)]">
                              <button
                                type="button"
                                className="grid size-8 place-items-center"
                                aria-label={t.increaseQuantity}
                                onClick={() =>
                                  setQuantity(item.productId, item.priceId, item.quantity + 1)
                                }
                              >
                                +
                              </button>
                              <span className="w-7 text-center text-sm">{item.quantity}</span>
                              <button
                                type="button"
                                className="grid size-8 place-items-center"
                                aria-label={t.decreaseQuantity}
                                onClick={() =>
                                  setQuantity(item.productId, item.priceId, item.quantity - 1)
                                }
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
                          {subtotal.toLocaleString(
                            locale === "ar" ? "ar-EG" : locale === "it" ? "it-IT" : "en-EG",
                          )}{" "}
                          {t.egp}
                        </span>
                      </div>
                      <Link
                        href="/order"
                        onClick={() => setOpen(false)}
                        className="mt-5 flex min-h-12 items-center justify-center rounded-full bg-[var(--color-brand-secondary)] px-5 font-bold text-[var(--color-on-brand)] transition hover:bg-[var(--color-brand-primary-deep)]"
                      >
                        {t.continueOrder}
                      </Link>
                      <button
                        type="button"
                        onClick={clear}
                        className="mt-3 w-full py-2 text-sm text-[var(--color-text-muted)]"
                      >
                        {t.clearCart}
                      </button>
                    </div>
                  </>
                )}
              </aside>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
