import Link from "next/link";
import { LogoMark } from "@/components/ui/logo-mark";
import { getServerLocale } from "@/i18n/server";
import { getTranslations } from "@/i18n/translations";

export default async function NotFound() {
  const translations = getTranslations(await getServerLocale());
  return (
    <main className="min-h-[70vh] px-5 py-16">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto grid size-24 place-items-center rounded-full bg-[rgba(128,128,96,0.12)]">
          <LogoMark size={58} />
        </div>
        <p className="mt-8 text-sm font-semibold text-[var(--color-text-muted)]">404</p>
        <h1 className="mt-3 text-4xl font-semibold">{translations.notFound.title}</h1>
        <p className="mt-4 leading-7 text-[var(--color-text-muted)]">
          {translations.notFound.description}
        </p>
        <Link
          className="mt-8 inline-flex min-h-11 items-center rounded-[var(--radius-pill)] bg-[var(--color-brand-secondary)] px-5 text-sm font-semibold text-[var(--color-on-brand)]"
          href="/"
        >
          {translations.notFound.home}
        </Link>
      </div>
    </main>
  );
}
