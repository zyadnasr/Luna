"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPublicOrder } from "@/lib/orders/actions";
import { useCart } from "./cart-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import type { OrderContext } from "@/types/orders";
import { useLocale } from "@/components/ui/locale-provider";
import { getPublicCopy } from "@/i18n/public";
export function CheckoutForm({
  zones,
  context,
}: {
  zones: Array<{ id: string; name_ar: string; delivery_fee_egp: number }>;
  context: OrderContext;
}) {
  const router = useRouter();
  const { locale } = useLocale();
  const t = getPublicCopy(locale);
  const { items, clear } = useCart();
  const [data, setData] = useState({
    name: "",
    phone: "",
    zone: "",
    address: "",
    location: "",
    notes: "",
    time: "",
    payment: "cash" as "cash" | "instapay",
  });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [proof, setProof] = useState<File | undefined>();
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const result = await createPublicOrder({
      source: context.type === "table" ? "qr_table" : "website",
      context,
      customerName: data.name,
      customerPhone: data.phone,
      deliveryZoneId: data.zone || undefined,
      deliveryAddress: data.address || undefined,
      deliveryLocationUrl: data.location || undefined,
      customerNotes: data.notes || undefined,
      requestedDeliveryTime: data.time || undefined,
      paymentMethod: data.payment,
      items,
      paymentProof: proof,
    });
    setSaving(false);
    if (!result.success) {
      setMessage(result.message);
      return;
    }
    clear();
    router.push(
      `/order/success?number=${encodeURIComponent(result.orderNumber ?? "")}&token=${encodeURIComponent(result.lookupToken ?? "")}`,
    );
  }
  if (context.type === "delivery" && !zones.length)
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-text-muted)]">
        {t.unavailableDelivery}
      </div>
    );
  return (
    <form className="grid gap-5" onSubmit={submit}>
      <label className="grid gap-2 text-sm font-semibold">
        {t.name}
        <Input
          required
          value={data.name}
          onChange={(event) => setData({ ...data, name: event.target.value })}
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        {t.phone}
        <Input
          required
          type="tel"
          value={data.phone}
          onChange={(event) => setData({ ...data, phone: event.target.value })}
        />
      </label>
      {context.type === "delivery" ? (
        <>
          <label className="grid gap-2 text-sm font-semibold">
            {t.zone}
            <Select
              required
              value={data.zone}
              onChange={(event) => setData({ ...data, zone: event.target.value })}
            >
              <option value="">{t.chooseZone}</option>
              {zones.map((zone) => (
                <option value={zone.id} key={zone.id}>
                  {zone.name_ar} · {zone.delivery_fee_egp} {t.egp}
                </option>
              ))}
            </Select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            {t.address}
            <Textarea
              required
              value={data.address}
              onChange={(event) => setData({ ...data, address: event.target.value })}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            {t.location}
            <Input
              type="url"
              value={data.location}
              onChange={(event) => setData({ ...data, location: event.target.value })}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            {t.time}
            <Input
              type="datetime-local"
              value={data.time}
              onChange={(event) => setData({ ...data, time: event.target.value })}
            />
          </label>
        </>
      ) : null}
      <label className="grid gap-2 text-sm font-semibold">
        {t.notes}
        <Textarea
          value={data.notes}
          onChange={(event) => setData({ ...data, notes: event.target.value })}
        />
      </label>
      <fieldset className="grid gap-3">
        <legend className="text-sm font-semibold">{t.payment}</legend>
        <label className="flex gap-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] p-3">
          <input
            type="radio"
            checked={data.payment === "cash"}
            onChange={() => setData({ ...data, payment: "cash" })}
          />{" "}
          {t.cash}
        </label>
        <label className="flex gap-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] p-3">
          <input
            type="radio"
            checked={data.payment === "instapay"}
            onChange={() => setData({ ...data, payment: "instapay" })}
          />{" "}
          {t.instapay}
        </label>
      </fieldset>
      {data.payment === "instapay" ? (
        <label className="grid gap-2 text-sm font-semibold">
          {t.proof}
          <input
            required
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => setProof(event.target.files?.[0])}
          />
          <span className="text-xs font-normal text-[var(--color-text-muted)]">{t.proofHelp}</span>
        </label>
      ) : null}
      {message ? (
        <p className="text-sm text-[var(--color-danger)]" role="alert">
          {message}
        </p>
      ) : null}
      <Button disabled={saving || !items.length}>{saving ? t.submitting : t.submit}</Button>
    </form>
  );
}
