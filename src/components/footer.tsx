"use client";

import Link from "next/link";
import { LogoMark } from "./ui/logo-mark";
import { useLocale } from "./ui/locale-provider";

const footerCopy = {
  ar: { brand: "Luna Healthy", footer: "بنية تشغيلية قيد الإعداد" },
  en: { brand: "Luna Healthy", footer: "Operations foundation in progress" },
  it: { brand: "Luna Healthy", footer: "Base operativa in preparazione" },
} as const;

export function Footer() {
  const { locale } = useLocale();
  const copy = footerCopy[locale];
  return (
    <footer className="mt-16 border-t border-[var(--color-border)] bg-[var(--color-background-deep)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 pb-[calc(var(--public-bottom-nav-space)+1rem)] sm:px-8 md:flex-row md:items-end md:justify-between md:pb-10">
        <div>
          <div className="flex items-center gap-3">
            <LogoMark size={34} />
            <span className="font-semibold">{copy.brand}</span>
          </div>
          <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--color-text-muted)]">
            {copy.footer}
          </p>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-[var(--color-text-secondary)]">
          <Link href="https://www.instagram.com/luna.healthy_/" target="_blank" rel="noreferrer">
            Instagram
          </Link>
          <Link href="https://www.facebook.com/share/18RP7phMhW/" target="_blank" rel="noreferrer">
            Facebook
          </Link>
          <Link href="https://wa.me/201551612195" target="_blank" rel="noreferrer">
            WhatsApp
          </Link>
        </div>
      </div>
    </footer>
  );
}
