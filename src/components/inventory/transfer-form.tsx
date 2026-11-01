"use client";
import { useState } from "react";
import { createTransfer } from "@/lib/inventory/actions";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/ui/locale-provider";
import { translateAdminText } from "@/i18n/admin-text";
export function TransferForm({
  warehouses,
  items,
  batches,
}: {
  warehouses: Array<{ id: string; name: string }>;
  items: Array<{ id: string; name_ar: string }>;
  batches: Array<{
    id: string;
    inventory_item_id: string;
    warehouse_id: string;
    quantity_available: number;
    batch_number: string | null;
  }>;
}) {
  const { locale } = useLocale();
  const t = (value: string) => translateAdminText(locale, value);
  const [source, setSource] = useState(warehouses[0]?.id ?? "");
  const [destination, setDestination] = useState(warehouses[1]?.id ?? "");
  const [item, setItem] = useState(items[0]?.id ?? "");
  const [batch, setBatch] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [message, setMessage] = useState("");
  const available = batches.filter(
    (entry) => entry.inventory_item_id === item && entry.warehouse_id === source,
  );
  return (
    <form
      className="grid gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
      action={async () =>
        setMessage(
          (
            await createTransfer({
              sourceWarehouseId: source,
              destinationWarehouseId: destination,
              itemId: item,
              batchId: batch,
              quantity,
            })
          ).message,
        )
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">
          {t("من")}
          <Select value={source} onChange={(event) => setSource(event.target.value)}>
            {warehouses.map((warehouse) => (
              <option value={warehouse.id} key={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          {t("إلى")}
          <Select value={destination} onChange={(event) => setDestination(event.target.value)}>
            {warehouses.map((warehouse) => (
              <option value={warehouse.id} key={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          {t("العنصر")}
          <Select value={item} onChange={(event) => setItem(event.target.value)}>
            {items.map((entry) => (
              <option value={entry.id} key={entry.id}>
                {entry.name_ar}
              </option>
            ))}
          </Select>
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          {t("الدفعة")}
          <Select value={batch} onChange={(event) => setBatch(event.target.value)}>
            <option value="">{t("اختيار الدفعة")}</option>
            {available.map((entry) => (
              <option value={entry.id} key={entry.id}>
                {entry.batch_number ?? t("بدون رقم")} · {entry.quantity_available}
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
      </div>
      <label className="grid gap-2 text-sm font-semibold">
        {t("ملاحظات")}
        <Textarea />
      </label>
      {message ? (
        <p role="status" className="text-sm">
          {message}
        </p>
      ) : null}
      <Button>{t("إنشاء مسودة النقل")}</Button>
    </form>
  );
}
