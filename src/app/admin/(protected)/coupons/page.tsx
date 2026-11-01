import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { createCoupon, toggleCoupon } from "@/lib/orders/coupons";
import { getServerLocale } from "@/i18n/server";
import { translateAdminText } from "@/i18n/admin-text";

export const dynamic = "force-dynamic";

export default async function CouponsPage() {
  await requireRole("owner");
  const supabase = await createClient();
  const [{ data: coupons }, { data: products }] = await Promise.all([
    supabase.from("coupons").select("id, code, name, discount_percent, is_active, uses_count, max_uses, applies_to_all").order("created_at", { ascending: false }),
    supabase.from("products").select("id, product_translations(locale, name)").eq("availability_status", "available"),
  ]);
  const locale = await getServerLocale();
  const t = (value: string) => translateAdminText(locale, value);
  return (
    <section>
      <p className="text-sm font-semibold text-[var(--color-brand-primary)]">{t("الإدارة")}</p>
      <h1 className="mt-3 text-4xl font-semibold">{t("الكوبونات")}</h1>
      <p className="mt-4 text-[var(--color-text-muted)]">{t("أنشئ أكواد خصم وحدد المنتجات التي ينطبق عليها الكود.")}</p>
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <form action={createCoupon} className="grid gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <label className="grid gap-2 text-sm font-semibold">{t("كود الخصم")}<input name="code" required maxLength={32} className="min-h-11 rounded-xl border border-[var(--color-border)] bg-transparent px-3 uppercase" placeholder="LUNA10" /></label>
          <label className="grid gap-2 text-sm font-semibold">{t("اسم الكوبون")}<input name="name" required className="min-h-11 rounded-xl border border-[var(--color-border)] bg-transparent px-3" placeholder="خصم العملاء الجدد" /></label>
          <label className="grid gap-2 text-sm font-semibold">{t("نسبة الخصم")}<input name="discount_percent" required type="number" min="1" max="100" step="0.01" className="min-h-11 rounded-xl border border-[var(--color-border)] bg-transparent px-3" /></label>
          <label className="grid gap-2 text-sm font-semibold">{t("الحد الأقصى للاستخدام")}<input name="max_uses" type="number" min="1" className="min-h-11 rounded-xl border border-[var(--color-border)] bg-transparent px-3" placeholder={t("بدون حد")} /></label>
          <fieldset className="grid gap-2"><legend className="text-sm font-semibold">{t("المنتجات المسموح بها")}</legend><p className="text-xs text-[var(--color-text-muted)]">{t("اتركها فارغة ليعمل الكوبون على كل المنتجات.")}</p>{(products ?? []).map((product) => <label className="flex gap-2 text-sm" key={product.id}><input type="checkbox" name="product_id" value={product.id} />{product.product_translations?.find((item: { locale: string }) => item.locale === locale)?.name ?? product.product_translations?.[0]?.name}</label>)}</fieldset>
          <button className="min-h-11 rounded-full bg-[var(--color-brand-secondary)] px-5 font-semibold text-[var(--color-on-brand)]" type="submit">{t("حفظ الكوبون")}</button>
        </form>
        <div className="grid gap-3">
          {(coupons ?? []).map((coupon) => <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5" key={coupon.id}><div><p className="font-bold">{coupon.code} · {coupon.discount_percent}%</p><p className="mt-1 text-sm text-[var(--color-text-muted)]">{coupon.name} · {coupon.applies_to_all ? t("كل المنتجات") : t("منتجات محددة")} · {coupon.uses_count}{coupon.max_uses ? `/${coupon.max_uses}` : ""}</p></div><form action={toggleCoupon.bind(null, coupon.id, !coupon.is_active)}><button className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm" type="submit">{coupon.is_active ? t("تعطيل") : t("تفعيل")}</button></form></div>)}
          {!coupons?.length ? <p className="rounded-xl border border-dashed border-[var(--color-border)] p-8 text-center text-sm text-[var(--color-text-muted)]">{t("لا توجد كوبونات بعد")}</p> : null}
        </div>
      </div>
    </section>
  );
}
