"use client";
import { useState } from "react";
import { receiveBatch } from "@/lib/inventory/actions";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/ui/locale-provider";
import { translateAdminText } from "@/i18n/admin-text";
export function BatchReceiveForm({
  items,
  warehouses,
}: {
  items: Array<{ id: string; name: string; unit: string }>;
  warehouses: Array<{ id: string; name: string }>;
}) {
  const { locale } = useLocale();
  const t = (value: string) => translateAdminText(locale, value);
  const [itemId, setItemId] = useState(items[0]?.id ?? "");
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id ?? "");
  const [quantity, setQuantity] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [message, setMessage] = useState("");
  return (
    <form
      className="grid gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
      action={async () =>
        setMessage(
          (await receiveBatch({ itemId, warehouseId, quantity, receivedAt: date })).message,
        )
      }
    >
      <label className="grid gap-2 text-sm font-semibold">
        {t("العنصر")}
        <Select value={itemId} onChange={(event) => setItemId(event.target.value)}>
          {items.map((item) => (
            <option value={item.id} key={item.id}>
              {item.name} · {item.unit}
            </option>
          ))}
        </Select>
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        {t("المستودع")}
        <Select value={warehouseId} onChange={(event) => setWarehouseId(event.target.value)}>
          {warehouses.map((warehouse) => (
            <option value={warehouse.id} key={warehouse.id}>
              {warehouse.name}
            </option>
          ))}
        </Select>
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        {t("الكمية")}
        <Input
          required
          min="0.001"
          step="0.001"
          type="number"
          value={quantity}
          onChange={(event) => setQuantity(Number(event.target.value))}
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        {t("تاريخ الاستلام")}
        <Input
          required
          type="datetime-local"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        {t("ملاحظات")}
        <Textarea />
      </label>
      {message ? (
        <p role="status" className="text-sm">
          {message}
        </p>
      ) : null}
      <Button>
        {locale === "ar" ? "استلام الدفعة" : locale === "it" ? "Ricevi lotto" : "Receive batch"}
      </Button>
    </form>
  );
}
