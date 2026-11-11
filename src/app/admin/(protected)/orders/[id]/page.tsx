import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { StatusTransition } from "@/components/orders/status-transition";
import { getPaymentProofUrl } from "@/lib/orders/actions";
import { PaymentReview } from "@/components/orders/payment-review";
import { OrderActivity } from "@/components/orders/order-activity";
import { PaymentTimeline } from "@/components/orders/payment-timeline";
import { OrderStatusBadgeLive } from "@/components/orders/order-status-badge-live";
import { getServerLocale } from "@/i18n/server";
import { translateAdminText } from "@/i18n/admin-text";
import { getTranslations } from "@/i18n/translations";

export const dynamic = "force-dynamic";

function InfoRow({
  label,
  children,
  last = false,
}: {
  label: string;
  children: ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className={`grid gap-1 py-3 text-sm sm:grid-cols-3 sm:gap-3 ${last ? "" : "border-b border-[var(--color-border)]"}`}
    >
      <span className="font-medium text-[var(--color-text-muted)]">{label}</span>
      <span className="min-w-0 break-words text-[var(--color-text-primary)] sm:col-span-2">{children}</span>
    </div>
  );
}

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("owner");
  const { id } = await params;
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*), order_status_history(*)")
    .eq("id", id)
    .maybeSingle();
  if (!order) notFound();

  const locale = await getServerLocale();
  const t = (value: string) => translateAdminText(locale, value);
  const translations = getTranslations(locale);
  const numberLocale = locale === "ar" ? "ar-EG" : locale;
  const [{ data: payments }, { data: activities }] = await Promise.all([
    supabase
      .from("payments")
      .select("*")
      .eq("order_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("audit_logs")
      .select("id, action, actor_user_id, created_at, metadata")
      .eq("entity_type", "order")
      .eq("entity_id", id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--color-border)] pb-6">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--color-brand-primary)]">
            {t("تفاصيل الطلب")}
          </p>
          <h1 className="mt-2 break-words text-2xl font-bold leading-tight tracking-tight sm:text-4xl">
            {t("الطلب")}{" "}
            <span className="text-[var(--color-brand-primary)]">#{order.order_number}</span>
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            {new Date(order.created_at).toLocaleString(numberLocale, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
        <OrderStatusBadgeLive
          initialStatus={order.status}
          orderNumber={order.order_number}
          token={order.status_lookup_token}
        />
      </header>

      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-5">
          <article className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)] sm:p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <span className="grid size-8 place-items-center rounded-[var(--radius-sm)] bg-[var(--color-nav-active-bg)] text-[var(--color-brand-primary)]">
                ⌁
              </span>
              {t("تفاصيل الطلب")}
            </h2>
            <div className="mt-4">
              <InfoRow label={t("المصدر")}>
                {translations.orders.source[order.source] ?? order.source}
              </InfoRow>
              <InfoRow label={t("مصدر الإعلان")}>{order.attribution_source || "-"}</InfoRow>
              <InfoRow label={t("نوع الإسناد")}>{order.attribution_type || "-"}</InfoRow>
              <InfoRow label={t("الحملة الإعلانية")}>{order.attribution_utm_campaign || "-"}</InfoRow>
              <InfoRow label={t("وسيط الإعلان")}>{order.attribution_utm_medium || "-"}</InfoRow>
              <InfoRow label={t("صفحة الإحالة")}>{order.attribution_referrer || "-"}</InfoRow>
              <InfoRow label={t("معرّفات الإعلان")}>{[order.attribution_gclid && `gclid: ${order.attribution_gclid}`, order.attribution_fbclid && `fbclid: ${order.attribution_fbclid}`].filter(Boolean).join(" · ") || "-"}</InfoRow>
              <InfoRow label={t("كود الخصم")}>{order.coupon_code || "-"}</InfoRow>
              <InfoRow label={t("قيمة الخصم")}>{Number(order.discount_egp || 0).toLocaleString(numberLocale)} EGP</InfoRow>
              <InfoRow label={t("نوع الطلب")}>
                <span className="inline-flex rounded-[var(--radius-pill)] bg-[var(--color-info)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--color-info)]">
                  {translations.orders.type[order.order_type] ?? order.order_type}
                </span>
              </InfoRow>
              <InfoRow label={t("اسم العميل")}>
                <span className="font-semibold">{order.customer_name ?? "-"}</span>
              </InfoRow>
              <InfoRow label={t("الهاتف")}>{order.customer_phone ?? "-"}</InfoRow>
              <InfoRow label={t("العنوان")}>{order.delivery_address ?? "-"}</InfoRow>
              <InfoRow label={t("ملاحظات")}>
                {order.customer_notes || (
                  <span className="italic text-[var(--color-text-muted)]">-</span>
                )}
              </InfoRow>
              <InfoRow label={t("الإجمالي")} last>
                <span className="text-xl font-bold text-[var(--color-success)]">
                  {Number(order.total_egp).toLocaleString(numberLocale)} EGP
                </span>
              </InfoRow>
            </div>
          </article>

          <article className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)] sm:p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <span className="grid size-8 place-items-center rounded-[var(--radius-sm)] bg-[var(--color-nav-active-bg)] text-[var(--color-brand-primary)]">
                ▣
              </span>
              {t("الدفع")}
            </h2>
            {payments?.map((payment, index) => (
              <div
                className={`${index ? "mt-5 border-t border-[var(--color-border)] pt-5" : "mt-4"}`}
                key={payment.id}
              >
                <InfoRow label={t("الطريقة")}>
                  {translations.orders.payment[payment.method] ?? payment.method}
                </InfoRow>
                <InfoRow label={t("الحالة")}>
                  <span className="inline-flex rounded-[var(--radius-pill)] bg-[var(--color-warning)]/15 px-2.5 py-1 text-xs font-semibold text-[var(--color-warning)]">
                    {translations.orders.payment[payment.status] ?? payment.status}
                  </span>
                </InfoRow>
                <InfoRow label={t("المبلغ")} last>
                  {Number(payment.amount_egp).toLocaleString(numberLocale)} EGP
                </InfoRow>
                <div className="mt-4">
                  <PaymentProof paymentId={payment.id} status={payment.status} method={payment.method} />
                </div>
              </div>
            ))}
          </article>
        </div>

        <article className="min-w-0 flex flex-col rounded-[var(--radius-lg)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-soft)] sm:p-7 lg:col-span-7">
          <StatusTransition
            id={order.id}
            orderNumber={order.order_number}
            status={order.status}
            token={order.status_lookup_token}
          />
        </article>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <PaymentTimeline
          payments={
            (payments ?? []) as Array<{
              id: string;
              status: string;
              created_at: string;
              notes: string | null;
              verified_by: string | null;
            }>
          }
        />
        <OrderActivity
          activities={
            (activities ?? []) as Array<{
              id: string;
              action: string;
              actor_user_id: string | null;
              created_at: string;
              metadata: unknown;
            }>
          }
        />
      </div>

      <article className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
        <h2 className="text-xl font-bold">{t("المنتجات")}</h2>
        <div className="mt-4">
          {order.order_items?.map(
            (item: {
              id: string;
              price_label_snapshot: string | null;
              quantity: number;
              line_total_egp: number;
            }) => (
              <div
                className="flex justify-between gap-4 border-t border-[var(--color-border)] py-3 text-sm"
                key={item.id}
              >
                <span>
                  {item.price_label_snapshot ?? t("منتج")} × {item.quantity}
                </span>
                <span className="font-semibold">
                  {Number(item.line_total_egp).toLocaleString(numberLocale)} EGP
                </span>
              </div>
            ),
          )}
        </div>
      </article>
    </section>
  );
}

async function PaymentProof({ paymentId, status, method }: { paymentId: string; status: string; method: string }) {
  const signedUrl = method === "instapay" ? await getPaymentProofUrl(paymentId) : null;
  return <PaymentReview paymentId={paymentId} status={status} signedUrl={signedUrl} method={method} />;
}
import type { ReactNode } from "react";
