import Link from "next/link";
import { getTranslations } from "@/i18n";
import { LanguageSwitcher } from "./language-switcher";
import { LogoMark } from "./ui/logo-mark";

export function Header() {
  const t = getTranslations();
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-surface-glass)] shadow-[var(--shadow-inset)] backdrop-blur-[var(--blur-glass)]">
      <div className="mx-auto flex min-h-20 w-full max-w-7xl items-center justify-between gap-5 px-5 sm:px-8">
        <Link href="/" className="group flex items-center gap-3" aria-label={t.brand}>
          <span className="grid size-12 place-items-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] transition-transform duration-200 group-hover:-rotate-3">
            <LogoMark size={38} />
          </span>
          <span className="hidden text-lg font-semibold tracking-[-0.02em] sm:inline">
            {t.brand}
          </span>
        </Link>
        <nav
          aria-label="Primary"
          className="hidden items-center gap-7 text-sm font-medium text-[var(--color-text-secondary)] md:flex"
        >
          <Link className="transition-colors hover:text-[var(--color-brand-primary)]" href="/">
            {t.navigation.home}
          </Link>
          <Link
            className="transition-colors hover:text-[var(--color-brand-primary)]"
            href="/health"
          >
            {t.navigation.health}
          </Link>
          <Link
            className="transition-colors hover:text-[var(--color-brand-primary)]"
            href="/design-system"
          >
            نظام التصميم
          </Link>
        </nav>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
