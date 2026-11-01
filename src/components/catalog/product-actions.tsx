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
        className="rounded-[var(--radius-pill)] border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold hover:border-[var(--color-brand-primary)]"
        href={`/admin/products/${id}`}
      >
        {t("تعديل")}
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
        className="rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-xs"
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
      >
        {t("حذف")}
      </button>
    </div>
  );
}
