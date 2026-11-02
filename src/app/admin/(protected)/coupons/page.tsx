import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { createCoupon, toggleCoupon } from "@/lib/orders/coupons";
import { getServerLocale } from "@/i18n/server";
import { translateAdminText } from "@/i18n/admin-text";

export const dynamic = "force-dynamic";

function CouponIcon({ kind }: { kind: "tag" | "products" | "uses" }) {
  return (
    <svg
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      {kind === "tag" ? (
        <path d="M4 5v6l9 9 7-7-9-9H4Z" strokeLinecap="round" strokeLinejoin="round" />
      ) : kind === "products" ? (
        <path d="M5 7h14M5 12h14M5 17h9" strokeLinecap="round" />
      ) : (
        <path d="M16 21a4 4 0 0 0-8 0M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" strokeLinecap="round" />
      )}
    </svg>
  );
}

export default async function CouponsPage() {
  await requireRole("owner");
  const supabase = await createClient();
  const [{ data: coupons }, { data: products }] = await Promise.all([
    supabase
      .from("coupons")
      .select("id, code, name, discount_percent, is_active, uses_count, max_uses, applies_to_all")
      .order("created_at", { ascending: false }),
    supabase
      .from("products")
      .select("id, product_translations(locale, name)")
      .eq("availability_status", "available"),
  ]);
  const locale = await getServerLocale();
  const t = (value: string) => translateAdminText(locale, value);
  const couponRows = coupons ?? [];
  const activeCount = couponRows.filter((coupon) => coupon.is_active).length;
  return (
    <section className="mx-auto max-w-6xl pb-12">
      <div className="flex flex-wrap items-end justify-between gap-5 border-b border-[var(--color-border)] pb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-brand-primary)]">
            {t("الإدارة")}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            {t("الكوبونات")}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--color-text-muted)] sm:text-base">
            {t("أنشئ أكواد خصم وحدد المنتجات التي ينطبق عليها الكود.")}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2 text-xs font-semibold text-[var(--color-text-muted)]">
          <span className="size-1.5 rounded-full bg-[var(--color-success)]" aria-hidden="true" />
          {activeCount}/{couponRows.length} {t("نشط")}
        </div>
      </div>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <form
          action={createCoupon}
          className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]"
        >
          <div className="border-b border-[var(--color-border)] bg-[var(--color-background-deep)]/25 px-6 py-5">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-brand-primary)]">
              {t("الكوبونات")}
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.025em]">
              {t("إضافة كوبون جديد")}
            </h2>
          </div>
          <div className="grid gap-5 p-6">
            <label className="grid gap-2 text-sm font-semibold">
              <span>{t("كود الخصم")}</span>
              <input
                name="code"
                required
                maxLength={32}
                className="min-h-11 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-background-deep)]/35 px-3 font-mono uppercase outline-none transition focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-focus-ring)]"
                placeholder="LUNA10"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              <span>{t("اسم الكوبون")}</span>
              <input
                name="name"
                required
                dir="auto"
                className="min-h-11 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-background-deep)]/35 px-3 outline-none transition focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-focus-ring)]"
                placeholder="خصم العملاء الجدد"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold">
                <span>{t("نسبة الخصم")}</span>
                <div className="relative">
                  <input
                    name="discount_percent"
                    required
                    type="number"
                    min="1"
                    max="100"
                    step="0.01"
                    className="min-h-11 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-background-deep)]/35 px-3 pe-10 outline-none transition focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-focus-ring)]"
                    placeholder="10"
                  />
                  <span className="pointer-events-none absolute inset-y-0 end-3 grid place-items-center text-sm text-[var(--color-text-muted)]">
                    %
                  </span>
                </div>
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                <span>{t("الحد الأقصى للاستخدام")}</span>
                <input
                  name="max_uses"
                  type="number"
                  min="1"
                  className="min-h-11 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-background-deep)]/35 px-3 outline-none transition focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-focus-ring)]"
                  placeholder={t("بدون حد")}
                />
              </label>
            </div>
            <fieldset className="grid gap-2">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <legend className="text-sm font-semibold">{t("المنتجات المسموح بها")}</legend>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {t("اتركها فارغة ليعمل الكوبون على كل المنتجات.")}
                </p>
              </div>
              <div className="max-h-56 overflow-y-auto rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-background-deep)]/35 p-2">
                {(products ?? []).length ? (
                  (products ?? []).map((product) => {
                    const name =
                      product.product_translations?.find(
                        (item: { locale: string }) => item.locale === locale,
                      )?.name ?? product.product_translations?.[0]?.name;
                    return (
                      <label
                        className="group flex cursor-pointer items-center gap-3 rounded-[var(--radius-xs)] px-3 py-2.5 text-sm transition hover:bg-[var(--color-surface)]"
                        key={product.id}
                      >
                        <input
                          type="checkbox"
                          name="product_id"
                          value={product.id}
                          className="size-4 accent-[var(--color-brand-primary)]"
                        />
                        <span className="text-[var(--color-text-secondary)] transition group-hover:text-[var(--color-text-primary)]">
                          {name}
                        </span>
                      </label>
                    );
                  })
                ) : (
                  <p className="p-3 text-sm text-[var(--color-text-muted)]">
                    {t("لا توجد منتجات مطابقة.")}
                  </p>
                )}
              </div>
            </fieldset>
            <button
              className="mt-1 inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-pill)] bg-[var(--color-brand-secondary)] px-5 font-semibold text-[var(--color-on-brand)] shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:bg-[var(--color-brand-primary-deep)] active:translate-y-0"
              type="submit"
            >
              <CouponIcon kind="tag" />
              {t("حفظ الكوبون")}
            </button>
          </div>
        </form>

        <div>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-brand-primary)]">
                {t("الإدارة")}
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.025em]">
                {t("الكوبونات الحالية")}
              </h2>
            </div>
            <span className="rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-muted)]">
              {couponRows.length} {t("الإجمالي")}
            </span>
          </div>
          <div className="grid gap-4">
            {couponRows.map((coupon) => (
              <article
                className={`group relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] ${coupon.is_active ? "" : "opacity-70"}`}
                key={coupon.id}
              >
                <div className="grid sm:grid-cols-[minmax(10rem,0.8fr)_minmax(0,1.2fr)]">
                  <div
                    className={`relative flex flex-col justify-center border-b border-[var(--color-border)] p-5 sm:border-b-0 sm:border-e sm:border-dashed ${coupon.is_active ? "bg-[var(--color-background-deep)]/35" : "bg-[var(--color-background-deep)]/15"}`}
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold tracking-[0.14em]">
                      <span
                        className={
                          coupon.is_active
                            ? "text-[var(--color-brand-primary)]"
                            : "text-[var(--color-text-muted)]"
                        }
                      >
                        <CouponIcon kind="tag" />
                      </span>
                      <span className="font-mono">{coupon.code}</span>
                    </div>
                    <p
                      className={`mt-3 text-3xl font-semibold tracking-[-0.05em] ${coupon.is_active ? "text-[var(--color-brand-primary)]" : "text-[var(--color-text-muted)]"}`}
                    >
                      {coupon.discount_percent}%{" "}
                      <span className="text-sm font-medium text-[var(--color-text-muted)]">
                        OFF
                      </span>
                    </p>
                  </div>
                  <div className="flex items-start justify-between gap-4 p-5">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-semibold" dir="auto">
                        {coupon.name}
                      </h3>
                      <div className="mt-3 grid gap-2 text-xs text-[var(--color-text-muted)]">
                        <p className="flex items-center gap-2">
                          <CouponIcon kind="products" />
                          {coupon.applies_to_all ? t("كل المنتجات") : t("منتجات محددة")}
                        </p>
                        <p className="flex items-center gap-2">
                          <CouponIcon kind="uses" />
                          {coupon.uses_count}
                          {coupon.max_uses ? `/${coupon.max_uses}` : ""}
                        </p>
                      </div>
                    </div>
                    <form
                      action={toggleCoupon.bind(null, coupon.id, !coupon.is_active)}
                      className="shrink-0"
                    >
                      <button
                        className={`relative h-6 w-11 rounded-full transition focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)] ${coupon.is_active ? "bg-[var(--color-brand-primary)]" : "bg-[var(--color-background-deep)]"}`}
                        type="submit"
                        aria-label={coupon.is_active ? t("تعطيل") : t("تفعيل")}
                      >
                        <span
                          className={`absolute top-0.5 size-5 rounded-full shadow-sm transition ${coupon.is_active ? "end-0.5 bg-[var(--color-background)]" : "start-0.5 bg-[var(--color-text-muted)]"}`}
                        />
                      </button>
                      <span
                        className={`mt-2 block text-[0.62rem] font-semibold uppercase tracking-[0.12em] ${coupon.is_active ? "text-[var(--color-brand-primary)]" : "text-[var(--color-text-muted)]"}`}
                      >
                        {coupon.is_active ? t("نشط") : t("معطل")}
                      </span>
                    </form>
                  </div>
                </div>
              </article>
            ))}
            {!couponRows.length ? (
              <p className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] p-10 text-center text-sm text-[var(--color-text-muted)]">
                {t("لا توجد كوبونات بعد")}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
