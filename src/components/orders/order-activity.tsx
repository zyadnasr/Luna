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
const safeAction = (action: string, t: ReturnType<typeof getTranslations>) => {
  const map: Record<string, string> = {
    "order.created": "تم إنشاء الطلب",
    "order.manual_created": "تم إنشاء طلب يدوي",
    "order.confirmed": "تم تأكيد الطلب",
    "order.rejected": "تم رفض الطلب",
    "order.cancelled": "تم إلغاء الطلب",
    "payment.proof_submitted": "تم إرسال إثبات الدفع",
    "payment.paid": "تم اعتماد الدفع",
    "payment.rejected": "تم رفض الدفع",
    "settings.instapay_updated": "تم تحديث إعداد Instapay",
  };
  return map[action] ?? action.split(".").pop() ?? t.orders.fields.audit;
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
              <p className="font-semibold">{safeAction(activity.action, t)}</p>
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
