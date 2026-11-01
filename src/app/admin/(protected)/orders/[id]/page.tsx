import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { StatusTransition } from "@/components/orders/status-transition";
import { getPaymentProofUrl } from "@/lib/orders/actions";
import { PaymentReview } from "@/components/orders/payment-review";
import { OrderActivity } from "@/components/orders/order-activity";
import { PaymentTimeline } from "@/components/orders/payment-timeline";
import { getServerLocale } from "@/i18n/server";
import { translateAdminText } from "@/i18n/admin-text";
export const dynamic = "force-dynamic";
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
  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("order_id", id)
    .order("created_at", { ascending: false });
  const { data: activities } = await supabase
    .from("audit_logs")
    .select("id, action, actor_user_id, created_at, metadata")
    .eq("entity_type", "order")
    .eq("entity_id", id)
    .order("created_at", { ascending: false });
  return (
    <section>
      <p className="text-sm text-[var(--color-brand-primary)]">{t("تفاصيل الطلب")}</p>
      <h1 className="mt-3 text-4xl font-semibold">{order.order_number}</h1>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <p>
            {t("المصدر")}: {order.source}
          </p>
          <p className="mt-2">
            {t("نوع الطلب")}: {order.order_type}
          </p>
          <p className="mt-2">
            {t("اسم العميل")}: {order.customer_name ?? "-"}
          </p>
          <p className="mt-2">
            {t("الهاتف")}: {order.customer_phone ?? "-"}
          </p>
          <p className="mt-2">
            {t("العنوان")}: {order.delivery_address ?? "-"}
          </p>
          <p className="mt-2">
            {t("ملاحظات")}: {order.customer_notes ?? "-"}
          </p>
          <p className="mt-2">
            {t("الإجمالي")}:{" "}
            {Number(order.total_egp).toLocaleString(locale === "ar" ? "ar-EG" : locale)} EGP
          </p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <p className="font-semibold">{t("تغيير الحالة")}</p>
          <div className="mt-4">
            <StatusTransition id={order.id} status={order.status} />
          </div>
        </div>
      </div>
      <div className="mt-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="text-xl font-semibold">{t("الدفع")}</h2>
        {payments?.map((payment) => (
          <div className="mt-5 border-t border-[var(--color-border)] pt-5" key={payment.id}>
            <p>
              {t("الطريقة")}: {payment.method}
            </p>
            <p className="mt-2">
              {t("الحالة")}: {payment.status}
            </p>
            <p className="mt-2">
              {t("المبلغ")}:{" "}
              {Number(payment.amount_egp).toLocaleString(locale === "ar" ? "ar-EG" : locale)} EGP
            </p>
            {payment.method === "instapay" ? (
              <PaymentProof paymentId={payment.id} status={payment.status} />
            ) : (
              <p className="mt-4 text-sm text-[var(--color-text-muted)]">
                {t("الدفع نقدًا، لا توجد صورة إثبات.")}
              </p>
            )}
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
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
      <div className="mt-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="text-xl font-semibold">{t("المنتجات")}</h2>
        {order.order_items?.map(
          (item: {
            id: string;
            product_name_snapshot: unknown;
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
              <span>
                {Number(item.line_total_egp).toLocaleString(locale === "ar" ? "ar-EG" : locale)} EGP
              </span>
            </div>
          ),
        )}
      </div>
    </section>
  );
}

async function PaymentProof({ paymentId, status }: { paymentId: string; status: string }) {
  const signedUrl = await getPaymentProofUrl(paymentId);
  return <PaymentReview paymentId={paymentId} status={status} signedUrl={signedUrl} />;
}
