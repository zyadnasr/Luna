"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/components/ui/locale-provider";
import { translateAdminText } from "@/i18n/admin-text";
import { saveHomepageMedia, type HomepageSettings } from "@/lib/site/homepage";

export function HomepageMediaForm({ initial }: { initial: HomepageSettings }) {
  const { locale } = useLocale();
  const t = (value: string) => translateAdminText(locale, value);
  const initialImages = [initial.hero, ...initial.gallery];
  const [previews, setPreviews] = useState(initialImages.map((image) => image.src));
  const [alts, setAlts] = useState(initialImages.map((image) => image.alt));
  const [galleryCount, setGalleryCount] = useState(Math.max(1, initial.gallery.length));
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <form
      encType="multipart/form-data"
      className="grid gap-5"
      action={async (formData) => {
        setSaving(true);
        const result = await saveHomepageMedia(formData);
        setMessage(t(result.message));
        setSaving(false);
      }}
    >
      <div>
        <h2 className="text-lg font-semibold">{t("صور الصفحة الرئيسية")}</h2>
        <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
          {t("ارفع صورة الهيرو وأضف صور الجاليري من جهازك. التعديل متاح للمالك فقط.")}
        </p>
      </div>

      <input name="gallery_count" type="hidden" value={galleryCount} />
      <label className="grid max-w-sm gap-2 text-sm font-semibold">
        {t("ترتيب الجاليري")}
        <select
          className="h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background-deep)] px-3 text-sm"
          defaultValue={initial.galleryArrangement}
          name="gallery_arrangement"
        >
          <option value="coverflow">{t("Coverflow سينمائي")}</option>
          <option value="row">{t("صف أفقي")}</option>
          <option value="grid">{t("شبكة")}</option>
          <option value="barrel">{t("برميل")}</option>
          <option value="helix">{t("حلزون")}</option>
          <option value="sphere">{t("دائرة")}</option>
        </select>
      </label>

      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
        <MediaField
          label={t("صورة الهيرو")}
          fileName="hero_file"
          altName="hero_alt"
          alt={alts[0]}
          chooseLabel={t("اختيار صورة")}
          altLabel={t("النص البديل")}
          fileHelp={t("PNG أو JPG أو WEBP · بحد أقصى 5 ميجابايت")}
          preview={previews[0]}
          onAltChange={(value) =>
            setAlts((current) => current.map((item, index) => (index === 0 ? value : item)))
          }
          onFileChange={(value) =>
            setPreviews((current) => current.map((item, index) => (index === 0 ? value : item)))
          }
        />
        {Array.from({ length: galleryCount }, (_, index) => {
          const itemIndex = index + 1;
          return (
            <MediaField
              key={`gallery-${index}`}
              label={`${t("صورة الجاليري")} ${index + 1}`}
              fileName={`gallery_${index}_file`}
              altName={`gallery_${index}_alt`}
              alt={alts[itemIndex] ?? ""}
              chooseLabel={t("اختيار صورة")}
              altLabel={t("النص البديل")}
              fileHelp={t("PNG أو JPG أو WEBP · بحد أقصى 5 ميجابايت")}
              preview={previews[itemIndex] ?? ""}
              onAltChange={(value) =>
                setAlts((current) =>
                  current.map((item, currentIndex) => (currentIndex === itemIndex ? value : item)),
                )
              }
              onFileChange={(value) =>
                setPreviews((current) =>
                  current.map((item, currentIndex) => (currentIndex === itemIndex ? value : item)),
                )
              }
            />
          );
        })}
      </div>

      {galleryCount < 12 ? (
        <Button
          className="justify-self-start"
          onClick={() => {
            setGalleryCount((count) => count + 1);
            setPreviews((current) => [...current, ""]);
            setAlts((current) => [...current, ""]);
          }}
          type="button"
          variant="secondary"
        >
          {t("إضافة صورة للجاليري")}
        </Button>
      ) : null}

      {message ? (
        <p className="mt-4 text-sm" role="status">
          {message}
        </p>
      ) : null}
      <Button className="mt-5 self-start" type="submit" disabled={saving}>
        {saving ? t("جارٍ الحفظ...") : t("رفع وحفظ صور الصفحة")}
      </Button>
    </form>
  );
}

function MediaField({
  label,
  fileName,
  altName,
  alt,
  preview,
  chooseLabel,
  altLabel,
  fileHelp,
  onAltChange,
  onFileChange,
}: {
  label: string;
  fileName: string;
  altName: string;
  alt: string;
  preview: string;
  chooseLabel: string;
  altLabel: string;
  fileHelp: string;
  onAltChange: (value: string) => void;
  onFileChange: (value: string) => void;
}) {
  return (
    <fieldset className="grid min-w-0 gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
      <legend className="px-1 text-sm font-semibold">{label}</legend>
      <div className="grid min-w-0 gap-3">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-background-deep)]">
          {preview ? (
            <Image
              src={preview}
              alt={alt || label}
              fill
              unoptimized
              sizes="112px"
              className="object-cover"
            />
          ) : (
            <div className="grid size-full place-items-center p-4 text-center text-xs text-[var(--color-text-muted)]">
              {chooseLabel}
            </div>
          )}
        </div>
        <div className="grid content-start gap-3">
          <label className="grid gap-1 text-xs font-semibold text-[var(--color-text-muted)]">
            {chooseLabel}
            <Input
              type="file"
              name={fileName}
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onFileChange(URL.createObjectURL(file));
              }}
              className="min-w-0 cursor-pointer overflow-hidden text-ellipsis p-2 text-xs file:me-3 file:rounded-full file:border-0 file:bg-[var(--color-brand-secondary)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[var(--color-on-brand)]"
            />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-[var(--color-text-muted)]">
            {altLabel}
            <Input
              name={altName}
              value={alt}
              onChange={(event) => onAltChange(event.target.value)}
            />
          </label>
          <p className="text-xs text-[var(--color-text-muted)]">{fileHelp}</p>
        </div>
      </div>
    </fieldset>
  );
}
