"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/ui/locale-provider";
import type { AnnouncementSettings } from "@/lib/site/announcement";

export function AnnouncementBar({ settings }: { settings: AnnouncementSettings }) {
  const pathname = usePathname();
  const { locale } = useLocale();
  const [visible, setVisible] = useState(true);
  if (pathname?.startsWith("/admin") || !settings.enabled || !visible) return null;
  const message = settings[locale] || settings.en || settings.ar || settings.it;
  if (!message) return null;

  return (
    <div
      data-announcement-bar="true"
      className="relative z-50 flex min-h-10 items-center justify-center bg-[var(--announcement-bg)] px-12 py-2 text-center text-xs font-semibold text-[var(--announcement-text)] sm:text-sm"
    >
      <p>{message}</p>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="absolute end-3 grid size-7 place-items-center rounded-full text-lg leading-none text-[var(--announcement-muted)] transition hover:bg-[var(--announcement-hover-bg)] hover:text-[var(--announcement-text)]"
        aria-label={
          locale === "ar"
            ? "إغلاق الإعلان"
            : locale === "it"
              ? "Chiudi annuncio"
              : "Close announcement"
        }
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
}
