"use client";

import { getTranslations } from "@/i18n";
import { useLocale } from "@/components/ui/locale-provider";
type Activity = {
  id: string;
  action: string;
  actor_user_id: string | null;
  created_at: string;
  metadata: unknown;
};
const safeAction = (
  action: string,
  locale: "ar" | "en" | "it",
  t: ReturnType<typeof getTranslations>,
) => {
  const map = {
    ar: {
      "order.created": "تم إنشاء الطلب",
      "order.manual_created": "تم إنشاء طلب يدوي",
      "order.confirmed": "تم تأكيد الطلب",
      "order.preparing": "بدأ تجهيز الطلب",
      "order.ready": "الطلب جاهز للتوصيل",
      "order.delivered": "تم تسليم الطلب",
      "order.delivered_by_customer": "أكد العميل استلام الطلب",
      "order.rejected": "تم رفض الطلب",
      "order.cancelled": "تم إلغاء الطلب",
      "payment.proof_submitted": "تم إرسال إثبات الدفع",
      "payment.paid": "تم اعتماد الدفع",
      "payment.rejected": "تم رفض الدفع",
      "settings.instapay_updated": "تم تحديث إعداد Instapay",
    },
    en: {
      "order.created": "Order created",
      "order.manual_created": "Manual order created",
      "order.confirmed": "Order confirmed",
      "order.preparing": "Order preparation started",
      "order.ready": "Order ready for delivery",
      "order.delivered": "Order delivered",
      "order.delivered_by_customer": "Customer confirmed receipt",
      "order.rejected": "Order rejected",
      "order.cancelled": "Order cancelled",
      "payment.proof_submitted": "Payment proof submitted",
      "payment.paid": "Payment approved",
      "payment.rejected": "Payment rejected",
      "settings.instapay_updated": "Instapay settings updated",
    },
    it: {
      "order.created": "Ordine creato",
      "order.manual_created": "Ordine manuale creato",
      "order.confirmed": "Ordine confermato",
      "order.preparing": "Preparazione dell'ordine iniziata",
      "order.ready": "Ordine pronto per la consegna",
      "order.delivered": "Ordine consegnato",
      "order.delivered_by_customer": "Il cliente ha confermato la ricezione",
      "order.rejected": "Ordine rifiutato",
      "order.cancelled": "Ordine annullato",
      "payment.proof_submitted": "Prova di pagamento inviata",
      "payment.paid": "Pagamento approvato",
      "payment.rejected": "Pagamento rifiutato",
      "settings.instapay_updated": "Impostazioni Instapay aggiornate",
    },
  } as const;
  return map[locale][action as keyof (typeof map)[typeof locale]] ?? t.orders.fields.audit;
};
export function OrderActivity({
  activities,
  empty = false,
}: {
  activities: Activity[];
  empty?: boolean;
}) {
  const { locale } = useLocale();
  const t = getTranslations(locale);
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <h2 className="text-xl font-semibold">{t.orders.fields.audit}</h2>
      {empty || !activities.length ? (
        <p className="mt-4 text-sm text-[var(--color-text-muted)]">
          {t.orders.messages.noActivity}
        </p>
      ) : (
        <div className="mt-5 grid gap-4">
          {activities.map((activity) => (
            <div className="border-s border-[var(--color-border-strong)] ps-4" key={activity.id}>
              <p className="font-semibold">{safeAction(activity.action, locale, t)}</p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                {new Date(activity.created_at).toLocaleString(locale === "ar" ? "ar-EG" : locale)} ·{" "}
                {activity.actor_user_id
                  ? t.orders.fields.actor
                  : locale === "ar"
                    ? "النظام"
                    : locale === "it"
                      ? "Sistema"
                      : "System"}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
