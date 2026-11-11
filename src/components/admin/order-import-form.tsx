"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { importOrdersFromExcel, type ImportResult } from "@/lib/imports/actions";
import { useLocale } from "@/components/ui/locale-provider";
import { translateAdminText } from "@/i18n/admin-text";

const initialState: ImportResult | null = null;

export function OrderImportForm() {
  const { locale } = useLocale();
  const t = (value: string) => translateAdminText(locale, value);
  const [fileName, setFileName] = useState("");
  const [state, action, pending] = useActionState(importOrdersFromExcel, initialState);
  return (
    <form action={action} className="grid gap-6">
      <div className="grid gap-2 text-sm font-semibold">
        {t("ملف Excel")}
        <Input
          id="order-import-file"
          name="file"
          type="file"
          accept=".xlsx,.xls,.csv"
          required
          onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
          className="sr-only"
        />
        <label
          className="flex min-h-14 cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 transition hover:border-[var(--color-brand-primary)]"
          htmlFor="order-import-file"
        >
          <span className="rounded-[var(--radius-pill)] bg-[var(--color-nav-active-bg)] px-3 py-2 text-sm font-semibold text-[var(--color-nav-active-text)]">
            {t("اختيار ملف")}
          </span>
          <span className="truncate text-sm font-normal text-[var(--color-text-muted)]">
            {fileName || t("لم يتم اختيار ملف")}
          </span>
        </label>
      </div>
      <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-background-deep)]/30 p-4 text-sm leading-7 text-[var(--color-text-muted)]">
        <p className="font-semibold text-[var(--color-text-primary)]">{t("الأعمدة المدعومة")}</p>
        <p className="mt-1">
          {t(
            "رقم الطلب، المصدر، الحالة، اسم العميل، الهاتف، العنوان، الإجمالي الفرعي، رسوم التوصيل، الإجمالي، طريقة الدفع، حالة الدفع، التاريخ.",
          )}
        </p>
        <p className="mt-1">
          {t(
            "الإجمالي مطلوب، وباقي الأعمدة لها قيم افتراضية آمنة. الحد الأقصى 5000 صف و10 ميجابايت.",
          )}
        </p>
      </div>
      {state ? (
        <div
          className={`rounded-[var(--radius-sm)] border p-4 text-sm ${state.success ? "border-[var(--color-success-border)] bg-[var(--color-success-soft)] text-[var(--color-success)]" : "border-[var(--color-danger-border)] bg-[var(--color-danger-soft)] text-[var(--color-danger)]"}`}
          role={state.success ? "status" : "alert"}
        >
          <p className="font-semibold">{t(state.message)}</p>
          {state.importedCount || state.failedCount ? (
            <p className="mt-1">
              {t("تم استيراد")} {state.importedCount} {t("صف، وفشل")} {state.failedCount} {t("صف.")}
            </p>
          ) : null}
        </div>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? t("جارٍ الاستيراد...") : t("بدء الاستيراد")}
      </Button>
    </form>
  );
}
