"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/components/ui/locale-provider";
import { translateAdminText } from "@/i18n/admin-text";
import { saveAnnouncementSettings } from "@/lib/site/announcement";
import type { AnnouncementSettings } from "@/lib/site/announcement";

export function AnnouncementSettingsForm({ initial }: { initial: AnnouncementSettings }) {
  const { locale } = useLocale();
  const t = (value: string) => translateAdminText(locale, value);
  const [settings, setSettings] = useState(initial);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
      action={async () => {
        setSaving(true);
        const result = await saveAnnouncementSettings(settings);
        setMessage(t(result.message));
        setSaving(false);
      }}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{t("شريط الإعلان")}</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {t("رسالة قصيرة تظهر أعلى الواجهة العامة ويمكن إغلاقها من الزائر.")}
          </p>
        </div>
        <label className="flex shrink-0 items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(event) => setSettings({ ...settings, enabled: event.target.checked })}
            className="size-4 accent-[var(--color-brand-primary)]"
          />
          {t("إظهار الشريط")}
        </label>
      </div>
      <div className="mt-6 grid gap-4">
        {(
          [
            ["ar", "النص العربي"],
            ["en", "النص الإنجليزي"],
            ["it", "النص الإيطالي"],
          ] as const
        ).map(([key, label]) => (
          <label className="grid gap-2 text-sm font-semibold" key={key}>
            {t(label)}
            <Textarea
              value={settings[key]}
              maxLength={180}
              onChange={(event) => setSettings({ ...settings, [key]: event.target.value })}
              placeholder={t("اكتب رسالة الإعلان")}
            />
          </label>
        ))}
      </div>
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
