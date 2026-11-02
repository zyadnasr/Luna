"use client";
import { useState } from "react";
import { saveInstapayNumber } from "@/lib/orders/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/ui/locale-provider";
import { translateAdminText } from "@/i18n/admin-text";
export function SettingsForm({ initial }: { initial: string }) {
  const { locale } = useLocale();
  const t = (value: string) => translateAdminText(locale, value);
  const [value, setValue] = useState(initial);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  return (
    <form
      className="grid gap-5"
      action={async () => {
        setSaving(true);
        setMessage((await saveInstapayNumber(value)).message);
        setSaving(false);
      }}
    >
      <label className="grid gap-2 text-sm font-semibold">
        {locale === "ar" ? "رقم Instapay" : locale === "it" ? "Numero Instapay" : "Instapay number"}
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={
            locale === "ar" ? "غير مكوّن" : locale === "it" ? "Non configurato" : "Not configured"
          }
        />
      </label>
      <p className="mt-3 text-sm text-[var(--color-text-muted)]">
        {locale === "ar"
          ? "يُقرأ هذا الرقم من app_settings ولا يتم تخزينه في الكود."
          : locale === "it"
            ? "Questo numero viene letto da app_settings e non è salvato nel codice."
            : "This number is read from app_settings and is not stored in code."}
      </p>
      {message ? (
        <p className="mt-4 text-sm" role="status">
          {message}
        </p>
      ) : null}
      <Button className="mt-5 self-start" disabled={saving}>
        {saving
          ? locale === "ar"
            ? "جارٍ الحفظ..."
            : locale === "it"
              ? "Salvataggio..."
              : "Saving..."
          : t("حفظ")}
      </Button>
    </form>
  );
}
