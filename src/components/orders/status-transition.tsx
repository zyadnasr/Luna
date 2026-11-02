"use client";
import { useState } from "react";
import { updateOrderStatus } from "@/lib/orders/actions";
import type { OrderStatus } from "@/types/orders";
import { useLocale } from "@/components/ui/locale-provider";
import { getTranslations } from "@/i18n";
import { translateAdminText } from "@/i18n/admin-text";
export function StatusTransition({ id, status }: { id: string; status: OrderStatus }) {
  const { locale } = useLocale();
  const t = getTranslations(locale);
  const [value, setValue] = useState(status);
  const [message, setMessage] = useState("");
  const statuses: OrderStatus[] = [
    "new",
    "confirmed",
    "preparing",
    "ready",
    "delivered",
    "cancelled",
    "rejected",
  ];
  return (
    <div>
      <select
        value={value}
        onChange={(event) => setValue(event.target.value as OrderStatus)}
        className="min-h-11 w-full rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
      >
        <option value={status}>{t.orders.status[status]}</option>
        {statuses
          .filter((item) => item !== status)
          .map((item) => (
            <option value={item} key={item}>
              {t.orders.status[item]}
            </option>
          ))}
      </select>
      <button
        type="button"
        className="mt-3 rounded-[var(--radius-pill)] bg-[var(--color-brand-secondary)] px-4 py-2 text-sm text-[var(--color-on-brand)]"
        onClick={async () =>
          setMessage(translateAdminText(locale, (await updateOrderStatus(id, value)).message))
        }
      >
        {locale === "ar" ? "حفظ الحالة" : locale === "it" ? "Salva stato" : "Save status"}
      </button>
      {message ? (
        <p className="mt-3 text-sm" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
