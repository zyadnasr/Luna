"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogoMark } from "./ui/logo-mark";
import { CartDrawer } from "./orders/cart-drawer";
import { ThemeToggle } from "./ui/theme-toggle";
import { useLocale } from "./ui/locale-provider";
import type { Locale } from "@/config/site";

const labels = {
  ar: {
    home: "الرئيسية",
    menu: "المنيو",
    quick: "طلب سريع",
    contact: "تواصل معنا",
    open: "فتح القائمة",
  },
  en: { home: "Home", menu: "Menu", quick: "Quick order", contact: "Contact", open: "Open menu" },
  it: {
    home: "Casa",
    menu: "Menu",
    quick: "Ordine rapido",
    contact: "Contatti",
    open: "Apri menu",
  },
} as const;

export function PublicHeader() {
  const { locale } = useLocale();
  const { setLocale } = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  const t = labels[locale];
  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);
  const languageLabels: Array<{ code: Locale; label: string }> = [
    { code: "ar", label: "ع" },
    { code: "en", label: "EN" },
    { code: "it", label: "IT" },
  ];
  return (
    <header className="luna-glass sticky top-0 z-40 border-b">
      <div className="relative mx-auto flex min-h-[4.75rem] max-w-7xl items-center justify-between px-4 sm:px-8">
        <Link
          href="/"
          aria-label="لونا هيلثي"
          className="absolute left-1/2 -translate-x-1/2 md:absolute md:right-8 md:left-auto md:translate-x-0"
        >
          <LogoMark size={44} />
        </Link>
        <div className="absolute right-4 flex items-center gap-2 md:hidden">
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full border border-[var(--color-border)] text-lg"
            aria-label={t.open}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((current) => !current)}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-5 fill-none stroke-current stroke-2"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
        <div className="absolute inset-y-0 left-4 hidden items-center gap-3 md:flex">
          <CartDrawer />
          <div className="flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-glass)] p-1">
            {languageLabels.map((language) => (
              <button
                key={language.code}
                type="button"
                onClick={() => setLocale(language.code)}
                className={`grid h-8 min-w-8 place-items-center rounded-full px-1 text-[10px] font-bold ${locale === language.code ? "bg-[var(--color-brand-secondary)] text-[var(--color-on-brand)]" : "text-[var(--color-text-muted)]"}`}
                aria-label={`تغيير اللغة إلى ${language.code}`}
              >
                {language.label}
              </button>
            ))}
          </div>
          <ThemeToggle />
        </div>
        <div className="absolute left-4 md:hidden">
          <CartDrawer />
        </div>
        <nav
          className="mx-auto hidden items-center gap-8 text-sm font-semibold md:flex"
          aria-label="التنقل الرئيسي"
        >
          <Link href="/">{t.home}</Link>
          <Link href="/menu">{t.menu}</Link>
          <Link href="/order">{t.quick}</Link>
          <Link href="https://wa.me/201551612195" target="_blank" rel="noreferrer">
            {t.contact}
          </Link>
        </nav>
      </div>
      {menuOpen ? (
        <div className="luna-mobile-menu absolute inset-x-4 top-[calc(100%+0.75rem)] z-50 rounded-[1.35rem] border p-4 md:hidden">
          <div className="mb-3 flex items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3">
            <span className="text-xs font-semibold text-[var(--color-text-muted)]">
              {locale === "ar" ? "الإعدادات" : locale === "it" ? "Impostazioni" : "Settings"}
            </span>
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-glass)] p-1">
                {languageLabels.map((language) => (
                  <button
                    key={language.code}
                    type="button"
                    onClick={() => setLocale(language.code)}
                    className={`grid h-8 min-w-8 place-items-center rounded-full px-1 text-[10px] font-bold ${locale === language.code ? "bg-[var(--color-brand-secondary)] text-[var(--color-on-brand)]" : "text-[var(--color-text-muted)]"}`}
                    aria-label={`تغيير اللغة إلى ${language.code}`}
                  >
                    {language.label}
                  </button>
                ))}
              </div>
              <ThemeToggle />
            </div>
          </div>
          <nav className="grid gap-1 text-sm font-semibold" aria-label={t.open}>
            <Link
              onClick={closeMenu}
              onNavigate={closeMenu}
              className="rounded-xl px-4 py-3 hover:bg-[var(--color-background-deep)]"
              href="/"
            >
              {t.home}
            </Link>
            <Link
              onClick={closeMenu}
              onNavigate={closeMenu}
              className="rounded-xl px-4 py-3 hover:bg-[var(--color-background-deep)]"
              href="/menu"
            >
              {t.menu}
            </Link>
            <Link
              onClick={closeMenu}
              onNavigate={closeMenu}
              className="rounded-xl px-4 py-3 hover:bg-[var(--color-background-deep)]"
              href="/order"
            >
              {t.quick}
            </Link>
            <Link
              onClick={closeMenu}
              className="rounded-xl px-4 py-3 hover:bg-[var(--color-background-deep)]"
              href="https://wa.me/201551612195"
              target="_blank"
              rel="noreferrer"
            >
              {t.contact}
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
