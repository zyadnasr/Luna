"use client";
import { useState } from "react";
import Image from "next/image";
import { reviewPayment } from "@/lib/orders/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/components/ui/locale-provider";
export function PaymentReview({
  paymentId,
  status,
  signedUrl,
  method,
}: {
  paymentId: string;
  status: string;
  signedUrl: string | null;
  method?: string;
}) {
  const { locale } = useLocale();
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const finalized = ["paid", "rejected", "refunded"].includes(status);
  async function submit(next: "paid" | "rejected") {
    setBusy(true);
    const result = await reviewPayment(paymentId, next, note);
    setMessage(result.message);
    setBusy(false);
  }
  return (
    <div className="grid gap-4">
      {signedUrl ? (
        <a
          href={signedUrl}
          target="_blank"
          rel="noreferrer"
          className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)]"
        >
          <Image
            src={signedUrl}
            alt={
              locale === "ar"
                ? "إثبات الدفع"
                : locale === "it"
                  ? "Prova di pagamento"
                  : "Payment proof"
            }
            width={800}
            height={600}
            unoptimized
            className="max-h-80 w-full object-contain"
          />
        </a>
      ) : (
        <p className="text-sm text-[var(--color-text-muted)]">
          {locale === "ar"
            ? "لا توجد صورة إثبات متاحة."
            : locale === "it"
              ? "Nessuna prova di pagamento disponibile."
              : "No payment proof is available."}
        </p>
      )}
      {!finalized ? (
        <>
          <Textarea
            placeholder={
              locale === "ar"
                ? "ملاحظة الرفض (اختيارية)"
                : locale === "it"
                  ? "Nota del rifiuto (facoltativa)"
                  : "Rejection note (optional)"
            }
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <div className="flex gap-3">
            <Button disabled={busy} onClick={() => submit("paid")}>
              {method === "cash"
                ? locale === "ar"
                  ? "تأكيد استلام الكاش"
                  : locale === "it"
                    ? "Conferma contanti ricevuti"
                    : "Confirm cash received"
                : locale === "ar"
                  ? "اعتماد الدفع"
                : locale === "it"
                  ? "Approva pagamento"
                  : "Approve payment"}
            </Button>
            <Button variant="secondary" disabled={busy} onClick={() => submit("rejected")}>
              {locale === "ar"
                ? "رفض الدفع"
                : locale === "it"
                  ? "Rifiuta pagamento"
                  : "Reject payment"}
            </Button>
          </div>
        </>
      ) : (
        <p className="text-sm text-[var(--color-text-muted)]">
          {locale === "ar"
            ? "تم إنهاء مراجعة هذا الدفع."
            : locale === "it"
              ? "La revisione del pagamento è completata."
              : "This payment review is finalized."}
        </p>
      )}
      {message ? (
        <p role="status" className="text-sm">
          {message}
        </p>
      ) : null}
    </div>
  );
}
