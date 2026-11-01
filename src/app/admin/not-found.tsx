import Link from "next/link";
import { LogoMark } from "@/components/ui/logo-mark";
import { getServerLocale } from "@/i18n/server";

export default async function AdminNotFound() {
  const locale = await getServerLocale();
  return (
    <main className="min-h-[calc(100vh-5rem)] px-5 py-12">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto grid size-24 place-items-center rounded-full bg-[rgba(128,128,96,0.12)]">
          <LogoMark size={58} />
        </div>
        <p className="mt-8 text-sm font-semibold text-[var(--color-text-muted)]">404</p>
        <h1 className="mt-3 text-4xl font-semibold">
          {locale === "ar"
            ? "الصفحة غير موجودة"
            : locale === "it"
              ? "Pagina non trovata"
              : "Page not found"}
        </h1>
        <p className="mt-4 leading-7 text-[var(--color-text-muted)]">
          {locale === "ar"
            ? "هذه الصفحة الإدارية غير متاحة بعد."
            : locale === "it"
              ? "Questa pagina amministrativa non è ancora disponibile."
              : "This admin page is not available yet."}
        </p>
        <Link
          className="mt-8 inline-flex min-h-11 items-center rounded-[var(--radius-pill)] bg-[var(--color-brand-secondary)] px-5 text-sm font-semibold text-[var(--color-on-brand)]"
          href="/admin"
        >
          {locale === "ar"
            ? "العودة إلى الإدارة"
            : locale === "it"
              ? "Torna all'amministrazione"
              : "Back to admin"}
        </Link>
      </div>
    </main>
  );
}
