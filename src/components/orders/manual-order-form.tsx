"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createManualOrder } from "@/lib/orders/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "./copy-button";
import { useLocale } from "@/components/ui/locale-provider";
import { translateAdminText } from "@/i18n/admin-text";
type Product = {
  id: string;
  name: string;
  prices: Array<{ id: string; label: string | null; price_egp: number }>;
};
export function ManualOrderForm({
  products,
  zones,
  instapayNumber,
}: {
  products: Product[];
  zones: Array<{ id: string; name_ar: string; delivery_fee_egp: number }>;
  instapayNumber: string;
}) {
  const router = useRouter();
  const { locale } = useLocale();
  const t = (value: string) => translateAdminText(locale, value);
  const [source, setSource] = useState<"talabat" | "uber" | "whatsapp" | "manual">("talabat");
  const [type, setType] = useState<"delivery" | "external">("delivery");
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [priceId, setPriceId] = useState(products[0]?.prices[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [items, setItems] = useState<
    Array<{ productId: string; priceId: string; quantity: number }>
  >([]);
  const [data, setData] = useState({
    reference: "",
    name: "",
    phone: "",
    notes: "",
    zone: "",
    address: "",
    location: "",
    payment: "cash" as "cash" | "instapay",
  });
  const [message, setMessage] = useState("");
  const [proof, setProof] = useState<File>();
  const selected = products.find((product) => product.id === productId);
  function selectProduct(value: string) {
    const product = products.find((item) => item.id === value);
    setProductId(value);
    setPriceId(product?.prices[0]?.id ?? "");
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const result = await createManualOrder({
      source,
      orderType: type,
      externalReference: data.reference,
      customerName: data.name,
      customerPhone: data.phone,
      notes: data.notes,
      deliveryZoneId: type === "delivery" ? data.zone : undefined,
      address: type === "delivery" ? data.address : undefined,
      locationUrl: type === "delivery" ? data.location : undefined,
      paymentMethod: data.payment,
      items,
      paymentProof: proof,
    });
    setMessage(result.message);
    if (result.success) router.push("/admin/orders");
  }
  return (
    <form className="grid gap-6" onSubmit={submit}>
      <div className="grid gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">
          {t("المصدر")}
          <Select
            value={source}
            onChange={(event) => setSource(event.target.value as typeof source)}
          >
            <option value="talabat">Talabat</option>
            <option value="uber">Uber</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="manual">
              {locale === "ar" ? "يدوي" : locale === "it" ? "Manuale" : "Manual"}
            </option>
          </Select>
        </label>
        {data.payment === "instapay" ? (
          <label className="grid gap-2 text-sm font-semibold">
            Instapay{" "}
            {instapayNumber ? (
              <span
                className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[rgba(128,128,96,0.1)] p-2 font-mono"
                dir="ltr"
              >
                {instapayNumber}
                <CopyButton value={instapayNumber} label="نسخ" />
              </span>
            ) : (
              <span className="text-[var(--color-danger)]">
                {t("رقم Instapay غير مكوّن. لا يمكن الإرسال.")}
              </span>
            )}
            {t("صورة إثبات Instapay")}
            <input
              required
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => setProof(event.target.files?.[0])}
            />
            <span className="text-xs font-normal text-[var(--color-text-muted)]">
              {locale === "ar"
                ? "PNG أو JPG أو WEBP، بحد أقصى 5 ميجابايت."
                : locale === "it"
                  ? "PNG, JPG o WEBP, massimo 5 MB."
                  : "PNG, JPG, or WEBP, up to 5 MB."}
            </span>
          </label>
        ) : null}
        <label className="grid gap-2 text-sm font-semibold">
          {t("نوع الطلب")}
          <Select value={type} onChange={(event) => setType(event.target.value as typeof type)}>
            <option value="delivery">
              {locale === "ar" ? "توصيل" : locale === "it" ? "Consegna" : "Delivery"}
            </option>
            <option value="external">
              {locale === "ar" ? "خارجي" : locale === "it" ? "Esterno" : "External"}
            </option>
          </Select>
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          {t("مرجع خارجي")}
          <Input
            value={data.reference}
            onChange={(event) => setData({ ...data, reference: event.target.value })}
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          {t("اسم العميل")}
          <Input
            value={data.name}
            onChange={(event) => setData({ ...data, name: event.target.value })}
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          {t("الهاتف")}
          <Input
            value={data.phone}
            onChange={(event) => setData({ ...data, phone: event.target.value })}
          />
        </label>
      </div>
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="text-xl font-semibold">{t("المنتجات")}</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_100px_auto]">
          <Select value={productId} onChange={(event) => selectProduct(event.target.value)}>
            {products.map((product) => (
              <option value={product.id} key={product.id}>
                {product.name}
              </option>
            ))}
          </Select>
          <Select value={priceId} onChange={(event) => setPriceId(event.target.value)}>
            {(selected?.prices ?? []).map((price) => (
              <option value={price.id} key={price.id}>
                {price.label ?? (locale === "ar" ? "السعر" : locale === "it" ? "Prezzo" : "Price")}{" "}
                · {price.price_egp} EGP
              </option>
            ))}
          </Select>
          <Input
            type="number"
            min="1"
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
          />
          <Button
            type="button"
            onClick={() => setItems([...items, { productId, priceId, quantity }])}
          >
            {t("إضافة")}
          </Button>
        </div>
        <ul className="mt-5 grid gap-2">
          {items.map((item, index) => (
            <li
              className="flex justify-between border-t border-[var(--color-border)] pt-3 text-sm"
              key={`${item.productId}-${item.priceId}-${index}`}
            >
              {products.find((product) => product.id === item.productId)?.name} × {item.quantity}
              <button
                type="button"
                className="text-[var(--color-danger)]"
                onClick={() => setItems(items.filter((_, itemIndex) => itemIndex !== index))}
              >
                {t("حذف")}
              </button>
            </li>
          ))}
        </ul>
      </div>
      {type === "delivery" ? (
        <div className="grid gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <label className="grid gap-2 text-sm font-semibold">
            {t("منطقة التوصيل")}
            <Select
              value={data.zone}
              onChange={(event) => setData({ ...data, zone: event.target.value })}
            >
              <option value="">
                {locale === "ar"
                  ? "اختر المنطقة"
                  : locale === "it"
                    ? "Scegli la zona"
                    : "Choose a zone"}
              </option>
              {zones.map((zone) => (
                <option value={zone.id} key={zone.id}>
                  {zone.name_ar} · {zone.delivery_fee_egp} ج.م
                </option>
              ))}
            </Select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            {t("العنوان")}
            <Textarea
              value={data.address}
              onChange={(event) => setData({ ...data, address: event.target.value })}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            {t("رابط الموقع")}
            <Input
              value={data.location}
              onChange={(event) => setData({ ...data, location: event.target.value })}
            />
          </label>
        </div>
      ) : null}
      <div className="grid gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <label className="grid gap-2 text-sm font-semibold">
          {t("الدفع")}
          <Select
            value={data.payment}
            onChange={(event) =>
              setData({ ...data, payment: event.target.value as typeof data.payment })
            }
          >
            <option value="cash">
              {locale === "ar" ? "نقدًا" : locale === "it" ? "Contanti" : "Cash"}
            </option>
            <option value="instapay">Instapay</option>
          </Select>
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          {t("ملاحظات")}
          <Textarea
            value={data.notes}
            onChange={(event) => setData({ ...data, notes: event.target.value })}
          />
        </label>
        {message ? (
          <p role="alert" className="text-sm text-[var(--color-danger)]">
            {message}
          </p>
        ) : null}
        <Button type="submit" disabled={data.payment === "instapay" && !instapayNumber}>
          {t("إنشاء الطلب")}
        </Button>
      </div>
    </form>
  );
}
