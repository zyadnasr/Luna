import Link from "next/link";
import { getTranslations } from "@/i18n";

export function MobileNav() {
  const t = getTranslations();
  return (
    <nav
      className="border-b border-[var(--color-border)] bg-[rgba(255,253,245,0.55)] px-5 py-3 md:hidden"
      aria-label={t.shell.menu}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto">
        <Link
          className="shrink-0 rounded-[var(--radius-pill)] bg-[var(--color-brand-secondary)] px-4 py-2 text-xs font-semibold text-[var(--color-on-brand)]"
          href="/"
        >
          {t.navigation.home}
        </Link>
        <Link
          className="shrink-0 rounded-[var(--radius-pill)] border border-[var(--color-border)] px-4 py-2 text-xs font-semibold text-[var(--color-text-secondary)]"
          href="/health"
        >
          {t.navigation.health}
        </Link>
        <Link
          className="shrink-0 rounded-[var(--radius-pill)] border border-[var(--color-border)] px-4 py-2 text-xs font-semibold text-[var(--color-text-secondary)]"
          href="/design-system"
        >
          نظام التصميم
        </Link>
      </div>
    </nav>
  );
}
