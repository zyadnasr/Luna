"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPublicOrder, validatePublicCoupon } from "@/lib/orders/actions";
import { useCart } from "./cart-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import type { OrderContext } from "@/types/orders";
import type { OrderErrorCode } from "@/types/orders";
import { useLocale } from "@/components/ui/locale-provider";
import { getPublicCopy } from "@/i18n/public";
import {
  isValidCustomerName,
  isValidEgyptianPhone,
  normalizeEgyptianPhoneInput,
} from "@/lib/orders/validation";
export function CheckoutForm({
  zones,
  context,
  onDeliveryFeeChange,
}: {
  zones: Array<{
    id: string;
    name_ar: string;
    name_en?: string;
    name_it?: string;
    delivery_fee_egp: number;
  }>;
  context: OrderContext;
  onDeliveryFeeChange?: (fee: number | null) => void;
}) {
  const router = useRouter();
  const { locale } = useLocale();
  const t = getPublicCopy(locale);
  const { items, clear } = useCart();
  const [data, setData] = useState({
    name: "",
    phone: "",
    zone: zones.length === 1 ? zones[0].id : "",
    address: "",
    location: "",
    notes: "",
    coupon: "",
    payment: "cash" as "cash" | "card",
  });
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ name: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [couponState, setCouponState] = useState<"idle" | "checking" | "applied" | "invalid">(
    "idle",
  );
  useEffect(() => {
    let cancelled = false;
    try {
      const saved = JSON.parse(localStorage.getItem("luna-customer-v1") ?? "null") as Partial<
        typeof data
      > | null;
      if (saved) {
        queueMicrotask(() => {
          if (!cancelled)
            setData((current) => ({
              ...current,
              ...saved,
              phone: normalizeEgyptianPhoneInput(saved.phone ?? ""),
              payment: "cash",
            }));
        });
      }
    } catch {
      // Ignore malformed local customer data.
    }
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    localStorage.setItem(
      "luna-customer-v1",
      JSON.stringify({
        name: data.name,
        phone: data.phone,
        address: data.address,
        location: data.location,
      }),
    );
  }, [data.name, data.phone, data.address, data.location]);
  useEffect(() => {
    const selectedZone = zones.find((zone) => zone.id === data.zone);
    onDeliveryFeeChange?.(selectedZone ? Number(selectedZone.delivery_fee_egp) : null);
  }, [data.zone, onDeliveryFeeChange, zones]);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving || !items.length) return;
    const nextFieldErrors = {
      name: isValidCustomerName(data.name) ? "" : t.invalidName,
      phone: isValidEgyptianPhone(data.phone) ? "" : t.invalidPhone,
    };
    setFieldErrors(nextFieldErrors);
    if (nextFieldErrors.name || nextFieldErrors.phone) return;
    setMessage("");
    setSaving(true);
    try {
      const result = await createPublicOrder({
        source: context.type === "table" ? "qr_table" : "website",
        context,
        customerName: data.name,
        customerPhone: `+20${data.phone}`,
        deliveryZoneId: data.zone || undefined,
        deliveryAddress: data.address || undefined,
        deliveryLocationUrl: data.location || undefined,
        customerNotes: data.notes || undefined,
        requestedDeliveryTime: new Date().toISOString(),
        paymentMethod: data.payment,
        couponCode: data.coupon || undefined,
        items,
      });
      if (!result.success) {
        const errorCopy: Partial<Record<OrderErrorCode, string>> = {
          generic: t.submitError,
          emptyCart: t.emptyCart,
          cardUnavailable: t.visaComingSoon,
          instapayNotConfigured: t.submitError,
          paymentProofRequired: t.proofHelp,
          invalidName: t.invalidName,
          invalidPhone: t.invalidPhone,
          invalidTableContext: t.submitError,
          deliveryRequired: t.submitError,
          invalidQrCode: t.submitError,
          productUnavailable: t.submitError,
          cartSelectionUnavailable: t.submitError,
          insufficientStock: t.stockUnavailable,
          zoneUnavailable: t.unavailableDelivery,
          invalidCoupon: t.couponInvalid,
          createOrderFailed: t.submitError,
          uploadProofFailed: t.submitError,
          saveOrderItemsFailed: t.submitError,
        };
        setMessage(errorCopy[result.errorCode ?? "generic"] ?? t.submitError);
        return;
      }
      if (!result.orderNumber || !result.lookupToken) {
        setMessage(t.submitError);
        return;
      }
      clear();
      router.replace(
        `/order/success?number=${encodeURIComponent(result.orderNumber)}&token=${encodeURIComponent(result.lookupToken)}`,
      );
    } catch (error) {
      console.error("Public order submission failed", error);
      setMessage(t.submitError);
    } finally {
      setSaving(false);
    }
  }
  async function applyCoupon() {
    if (!data.coupon.trim() || !items.length) return;
    setCouponState("checking");
    try {
      const result = await validatePublicCoupon({ code: data.coupon, items });
      setCouponState(result.success ? "applied" : "invalid");
    } catch {
      setCouponState("invalid");
    }
  }
  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setMessage(t.locationUnavailable);
      return;
    }
    setMessage("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const coordinates = `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
        setData((current) => ({
          ...current,
          address: `${t.locationDetected}: ${coordinates}`,
          location: `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`,
          zone: zones.length === 1 ? zones[0].id : current.zone,
        }));
      },
      () => setMessage(t.locationPermissionRequired),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
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
          autoComplete="name"
          value={data.name}
          onChange={(event) => {
            setData({ ...data, name: event.target.value });
            if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: "" });
          }}
          onBlur={() =>
            setFieldErrors({
              ...fieldErrors,
              name: isValidCustomerName(data.name) ? "" : t.invalidName,
            })
          }
          aria-invalid={!!fieldErrors.name}
        />
        {fieldErrors.name ? (
          <p className="text-xs font-normal text-[var(--color-danger)]" role="alert">
            {fieldErrors.name}
          </p>
        ) : null}
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        {t.phone}
        <div className="flex gap-2" dir="ltr">
          <div
            aria-label={t.egyptCountry}
            className="inline-flex min-h-12 shrink-0 items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-[var(--color-background-deep)] px-3 text-sm font-semibold"
          >
            <span aria-hidden="true">🇪🇬</span>
            <span>+20</span>
          </div>
          <Input
            required
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={10}
            pattern="1[0125][0-9]{8}"
            placeholder="10XXXXXXXX"
            value={data.phone}
            onChange={(event) => {
              setData({ ...data, phone: normalizeEgyptianPhoneInput(event.target.value) });
              if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: "" });
            }}
            onBlur={() =>
              setFieldErrors({
                ...fieldErrors,
                phone: isValidEgyptianPhone(data.phone) ? "" : t.invalidPhone,
              })
            }
            aria-invalid={!!fieldErrors.phone}
          />
        </div>
        <p className="text-xs font-normal text-[var(--color-text-muted)]">{t.egyptPhoneHint}</p>
        {fieldErrors.phone ? (
          <p className="text-xs font-normal text-[var(--color-danger)]" role="alert">
            {fieldErrors.phone}
          </p>
        ) : null}
      </label>
      {context.type === "delivery" ? (
        <>
          {zones.length > 1 ? (
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
                    {(locale === "ar"
                      ? zone.name_ar
                      : locale === "it"
                        ? zone.name_it
                        : zone.name_en) ?? zone.name_ar}{" "}
                    · {zone.delivery_fee_egp} {t.egp}
                  </option>
                ))}
              </Select>
            </label>
          ) : null}
          <label className="grid gap-2 text-sm font-semibold">
            {t.address}
            <Textarea
              required
              value={data.address}
              onChange={(event) => setData({ ...data, address: event.target.value })}
            />
          </label>
          <div className="grid gap-2 text-sm font-semibold">
            <span>{t.location}</span>
            <button
              type="button"
              onClick={useCurrentLocation}
              className="min-h-11 rounded-[var(--radius-pill)] border border-[var(--color-border)] px-4 text-start font-semibold transition hover:bg-[var(--color-background-deep)]"
            >
              {data.location ? t.locationDetected : t.useCurrentLocation}
            </button>
            {data.location ? (
              <a
                href={data.location}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-normal text-[var(--color-brand-primary)] underline"
              >
                {t.openLocation}
              </a>
            ) : null}
          </div>
        </>
      ) : null}
      <label className="grid gap-2 text-sm font-semibold">
        {t.notes}
        <Textarea
          value={data.notes}
          onChange={(event) => setData({ ...data, notes: event.target.value })}
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        {t.coupon}
        <div className="flex gap-2">
          <Input
            value={data.coupon}
            placeholder={t.couponPlaceholder}
            onChange={(event) => {
              setData({ ...data, coupon: event.target.value.toUpperCase() });
              setCouponState("idle");
            }}
          />
          <button
            type="button"
            disabled={couponState === "checking" || !data.coupon.trim() || !items.length}
            onClick={applyCoupon}
            className="inline-flex min-h-11 items-center rounded-[var(--radius-pill)] border border-[var(--color-border)] px-3 text-xs text-[var(--color-text-muted)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {couponState === "checking" ? t.checkingCoupon : t.applyCoupon}
          </button>
        </div>
        {couponState === "applied" ? (
          <p className="text-xs text-green-700">{t.couponApplied}</p>
        ) : null}
        {couponState === "invalid" ? (
          <p className="text-xs text-[var(--color-danger)]">{t.couponInvalid}</p>
        ) : null}
      </label>
      <fieldset className="grid gap-3">
        <legend className="text-sm font-semibold">{t.payment}</legend>
        <label className="flex gap-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] p-3">
          <input
            type="radio"
            checked={data.payment === "cash"}
            onChange={() => setData({ ...data, payment: "cash" })}
          />{" "}
          {t.cashOnDelivery}
        </label>
        <label className="flex cursor-not-allowed gap-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] p-3 opacity-60">
          <input
            type="radio"
            disabled
            checked={data.payment === "card"}
            onChange={() => setData({ ...data, payment: "card" })}
          />{" "}
          <span>
            <span>{t.visa}</span>
            <span className="ms-2 block text-xs font-normal">({t.visaComingSoon})</span>
          </span>
        </label>
      </fieldset>
      {message ? (
        <p className="text-sm text-[var(--color-danger)]" role="alert">
          {message}
        </p>
      ) : null}
      <Button type="submit" disabled={saving || !items.length}>
        {saving ? t.submitting : t.submit}
      </Button>
    </form>
  );
}
