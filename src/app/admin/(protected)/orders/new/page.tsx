import { requireRole } from "@/lib/auth/server";
import { getProducts } from "@/lib/catalog/queries";
import { createClient } from "@/lib/supabase/server";
import { ManualOrderForm } from "@/components/orders/manual-order-form";
import { getInstapaySettings } from "@/lib/orders/actions";
import { getServerLocale } from "@/i18n/server";
import { translateAdminText } from "@/i18n/admin-text";

export default async function NewOrderPage() {
  await requireRole("owner");
  const [{ products }, { data: zones }, instapayNumber] = await Promise.all([
    getProducts({ availability: "available" }),
    (await createClient())
      .from("delivery_zones")
      .select("id, name_ar, delivery_fee_egp")
      .eq("is_active", true),
    getInstapaySettings(),
  ]);
  const catalog = products.map((product) => ({
    id: product.id,
    name:
      product.product_translations.find((translation) => translation.locale === "ar")?.name ??
      product.id,
    prices: product.product_prices
      .filter((price) => price.is_active)
      .map((price) => ({ id: price.id, label: price.label, price_egp: price.price_egp })),
  }));
  const locale = await getServerLocale();
  const t = (value: string) => translateAdminText(locale, value);
  return (
    <section>
      <div className="border-b border-[var(--color-border)] pb-8">
        <p className="text-sm font-semibold text-[var(--color-brand-primary)]">{t("التشغيل")}</p>
        <h1 className="mt-3 text-4xl font-semibold">{t("طلب يدوي")}</h1>
        <p className="mt-4 text-[var(--color-text-muted)]">
          {t("Talabat وUber وWhatsApp والطلبات اليدوية من الكتالوج الحقيقي.")}
        </p>
      </div>
      <div className="mt-8">
        <ManualOrderForm products={catalog} zones={zones ?? []} instapayNumber={instapayNumber} />
      </div>
    </section>
  );
}
