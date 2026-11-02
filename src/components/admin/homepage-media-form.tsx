"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/components/ui/locale-provider";
import { translateAdminText } from "@/i18n/admin-text";
import { saveHomepageSettings, type HomepageSettings } from "@/lib/site/homepage";

export function HomepageMediaForm({ initial }: { initial: HomepageSettings }) {
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
        const result = await saveHomepageSettings(settings);
        setMessage(t(result.message));
        setSaving(false);
      }}
    >
      <div>
        <h2 className="text-lg font-semibold">{t("صور الصفحة الرئيسية")}</h2>
        <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
          {t("عدّل رابط صورة الهيرو وصور الجاليري. استخدم رابطًا عامًا أو مسارًا من assets.")}
        </p>
      </div>

      <div className="mt-6 grid gap-5">
        <MediaField
          label={t("صورة الهيرو")}
          value={settings.hero}
          onChange={(hero) => setSettings((current) => ({ ...current, hero }))}
        />
        {settings.gallery.map((image, index) => (
          <MediaField
            key={`gallery-${index}`}
            label={`${t("صورة الجاليري")} ${index + 1}`}
            value={image}
            onChange={(next) =>
              setSettings((current) => ({
                ...current,
                gallery: current.gallery.map((item, itemIndex) =>
                  itemIndex === index ? next : item,
                ) as HomepageSettings["gallery"],
              }))
            }
          />
        ))}
      </div>

      {message ? (
        <p className="mt-4 text-sm" role="status">
          {message}
        </p>
      ) : null}
      <Button className="mt-5" type="submit" disabled={saving}>
        {saving ? t("جارٍ الحفظ...") : t("حفظ صور الصفحة")}
      </Button>
    </form>
  );
}

function MediaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: { src: string; alt: string };
  onChange: (value: { src: string; alt: string }) => void;
}) {
  return (
    <fieldset className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
      <legend className="px-1 text-sm font-semibold">{label}</legend>
      <div className="grid gap-3 sm:grid-cols-[7rem_minmax(0,1fr)]">
        <div className="relative aspect-square overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-background-deep)]">
          <Image
            src={value.src}
            alt={value.alt || label}
            fill
            unoptimized
            sizes="112px"
            className="object-cover"
          />
        </div>
        <div className="grid gap-3">
          <label className="grid gap-1 text-xs font-semibold text-[var(--color-text-muted)]">
            Image URL
            <Input
              value={value.src}
              onChange={(event) => onChange({ ...value, src: event.target.value })}
              placeholder="/assets/example.jpg or https://..."
            />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-[var(--color-text-muted)]">
            Alt text
            <Input
              value={value.alt}
              onChange={(event) => onChange({ ...value, alt: event.target.value })}
              placeholder="Describe the image"
            />
          </label>
        </div>
      </div>
    </fieldset>
  );
}
