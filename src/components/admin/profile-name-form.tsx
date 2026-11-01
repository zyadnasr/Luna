"use client";

import { useState } from "react";
import { updateDisplayName } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/components/ui/locale-provider";
import { translateAdminText } from "@/i18n/admin-text";

export function ProfileNameForm({ initial }: { initial: string }) {
  const { locale } = useLocale();
  const t = (value: string) => translateAdminText(locale, value);
  const [value, setValue] = useState(initial);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
      action={async () => {
        setSaving(true);
        const result = await updateDisplayName(value);
        setMessage(result.success ? t("تم حفظ الاسم.") : t(result.message));
        setSaving(false);
      }}
    >
      <label className="grid gap-2 text-sm font-semibold">
        {t("الاسم الظاهر")}
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          maxLength={80}
          required
        />
      </label>
      <p className="mt-3 text-sm text-[var(--color-text-muted)]">
        {t("غيّر الاسم الذي يظهر في لوحة الإدارة. البريد الإلكتروني يظل مخصصًا لتسجيل الدخول.")}
      </p>
      {message ? (
        <p className="mt-4 text-sm" role="status">
          {message}
        </p>
      ) : null}
      <Button className="mt-5" type="submit" disabled={saving}>
        {saving ? t("جارٍ الحفظ...") : t("حفظ")}
      </Button>
    </form>
  );
}
