"use client";
import { useState } from "react";
import { createWaste } from "@/lib/inventory/actions";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/ui/locale-provider";
import { translateAdminText } from "@/i18n/admin-text";
export function WasteForm({
  items,
  batches,
  warehouses,
}: {
  items: Array<{ id: string; name_ar: string }>;
  batches: Array<{
    id: string;
    inventory_item_id: string;
    warehouse_id: string;
    quantity_available: number;
    batch_number: string | null;
  }>;
  warehouses: Array<{ id: string; name: string }>;
}) {
  const { locale } = useLocale();
  const t = (value: string) => translateAdminText(locale, value);
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id ?? "");
  const [itemId, setItemId] = useState(items[0]?.id ?? "");
  const [batchId, setBatchId] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState("damaged");
  const [message, setMessage] = useState("");
  const available = batches.filter(
    (batch) => batch.warehouse_id === warehouseId && batch.inventory_item_id === itemId,
  );
  return (
    <form
      className="grid gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
      action={async () =>
        setMessage((await createWaste({ warehouseId, itemId, batchId, quantity, reason })).message)
      }
    >
      <Select value={warehouseId} onChange={(event) => setWarehouseId(event.target.value)}>
        {warehouses.map((warehouse) => (
          <option value={warehouse.id} key={warehouse.id}>
            {warehouse.name}
          </option>
        ))}
      </Select>
      <Select value={itemId} onChange={(event) => setItemId(event.target.value)}>
        {items.map((item) => (
          <option value={item.id} key={item.id}>
            {item.name_ar}
          </option>
        ))}
      </Select>
      <Select value={batchId} onChange={(event) => setBatchId(event.target.value)}>
        <option value="">{t("اختيار الدفعة")}</option>
        {available.map((batch) => (
          <option value={batch.id} key={batch.id}>
            {batch.batch_number ?? t("بدون رقم")} · {t("المتاح")} {batch.quantity_available}
          </option>
        ))}
      </Select>
      <Input
        required
        min="0.001"
        step="0.001"
        type="number"
        value={quantity}
        onChange={(event) => setQuantity(Number(event.target.value))}
      />
      <Select value={reason} onChange={(event) => setReason(event.target.value)}>
        <option value="expired">{t("منتهي")}</option>
        <option value="damaged">{t("تالف")}</option>
        <option value="production_loss">{t("فاقد إنتاج")}</option>
        <option value="incorrect_storage">{t("تخزين خاطئ")}</option>
        <option value="other">{t("أخرى")}</option>
      </Select>
      <Textarea placeholder={t("ملاحظات")} />
      {message ? <p role="status">{message}</p> : null}
      <Button>{t("تسجيل الهدر")}</Button>
    </form>
  );
}
