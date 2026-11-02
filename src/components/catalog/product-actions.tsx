"use client";

import Link from "next/link";
import { useState } from "react";
import { deleteProduct, setProductAvailability } from "@/lib/catalog/actions";
import type { ProductAvailabilityStatus } from "@/types/domain";
import { useLocale } from "@/components/ui/locale-provider";
import { translateAdminText } from "@/i18n/admin-text";

const statuses: ProductAvailabilityStatus[] = ["available", "out_of_stock", "hidden"];

export function ProductActions({
  id,
  availability,
}: {
  id: string;
  availability: ProductAvailabilityStatus;
}) {
  const { locale } = useLocale();
  const t = (value: string) => translateAdminText(locale, value);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function change(next: ProductAvailabilityStatus) {
    setBusy(true);
    const result = await setProductAvailability(id, next);
    setMessage(result.message);
    setBusy(false);
  }
  async function remove() {
    if (!window.confirm(t("هل تريد حذف هذا المنتج نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.")))
      return;
    setBusy(true);
    const result = await deleteProduct(id);
    setMessage(t(result.message));
    setBusy(false);
  }
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {message ? (
        <span className="sr-only" role="status">
          {message}
        </span>
      ) : null}
      <Link
        className="inline-flex size-9 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[var(--color-text-muted)] transition hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]"
        href={`/admin/products/${id}`}
        aria-label={t("تعديل")}
        title={t("تعديل")}
      >
        <svg
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="m4 16-.7 4.7L8 20l11.7-11.7a2.1 2.1 0 0 0-3-3L4 16Z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="m14.5 6.5 3 3" strokeLinecap="round" />
        </svg>
      </Link>
      <select
        aria-label={
          locale === "ar"
            ? "تغيير حالة المنتج"
            : locale === "it"
              ? "Cambia stato prodotto"
              : "Change product status"
        }
        disabled={busy}
        value={availability}
        onChange={(event) => change(event.target.value as ProductAvailabilityStatus)}
        className="min-h-9 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs outline-none transition focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-focus-ring)]"
      >
        {statuses.map((status) => (
          <option value={status} key={status}>
            {t(status === "available" ? "متاح" : status === "out_of_stock" ? "نفد" : "مخفي")}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={busy}
        onClick={remove}
        className="rounded-[var(--radius-pill)] px-3 py-1.5 text-xs font-semibold text-[var(--color-danger)] hover:bg-[rgba(160,88,79,0.08)]"
        aria-label={t("حذف")}
        title={t("حذف")}
      >
        <svg
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M5 7h14M10 11v6m4-6v6M9 7V4h6v3m-9 0 1 13h10l1-13"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
