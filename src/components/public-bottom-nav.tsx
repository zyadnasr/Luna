"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "./ui/locale-provider";
import { getPublicCopy } from "@/i18n/public";

export function PublicBottomNav() {
  const pathname = usePathname();
  const { locale } = useLocale();
  const t = getPublicCopy(locale);
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  return (
    <nav
      className="luna-glass fixed inset-x-4 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] z-40 rounded-full border px-2 pb-2 pt-2 shadow-[0_0.75rem_2rem_rgba(25,24,18,0.16)] md:hidden"
      aria-label={t.appNavigation}
    >
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1 text-center text-[10px] font-semibold text-[var(--color-text-muted)]">
        <Link
          href="/"
          className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-full transition-colors ${isActive("/") ? "bg-[var(--color-nav-active-bg)] text-[var(--color-nav-active-text)] shadow-sm" : "hover:bg-[var(--color-background-deep)]"}`}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-5 fill-none stroke-current stroke-2"
          >
            <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
          </svg>
          {t.home}
        </Link>
        <Link
          href="/menu"
          className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-full transition-colors ${isActive("/menu") ? "bg-[var(--color-nav-active-bg)] text-[var(--color-nav-active-text)] shadow-sm" : "hover:bg-[var(--color-background-deep)]"}`}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-5 fill-none stroke-current stroke-2"
          >
            <path d="M4 5h16v14H4zM8 9h8M8 13h5" />
          </svg>
          {t.menu}
        </Link>
        <Link
          href="/order"
          className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-full transition-colors ${isActive("/order") ? "bg-[var(--color-nav-active-bg)] text-[var(--color-nav-active-text)] shadow-sm" : "hover:bg-[var(--color-background-deep)]"}`}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-5 fill-none stroke-current stroke-2"
          >
            <path d="M6 3h12v18l-6-3-6 3zM9 8h6M9 12h6" />
          </svg>
          {t.orders}
        </Link>
        <button
          type="button"
          className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-full hover:bg-[var(--color-background-deep)]"
          aria-label={t.accountUnavailable}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-5 fill-none stroke-current stroke-2"
          >
            <circle cx="12" cy="8" r="3" />
            <path d="M5 21a7 7 0 0 1 14 0" />
          </svg>
          {t.account}
        </button>
      </div>
    </nav>
  );
}
