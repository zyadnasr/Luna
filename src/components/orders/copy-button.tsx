"use client";
import { useState } from "react";
import { useLocale } from "@/components/ui/locale-provider";
export function CopyButton({ value, label = "نسخ" }: { value: string; label?: string }) {
  const { locale } = useLocale();
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="rounded-[var(--radius-pill)] border border-[var(--color-border)] px-3 py-1 text-xs"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied
        ? locale === "ar"
          ? "تم النسخ"
          : locale === "it"
            ? "Copiato"
            : "Copied"
        : locale === "ar"
          ? label
          : locale === "it"
            ? "Copia"
            : "Copy"}
    </button>
  );
}
