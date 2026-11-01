import Link from "next/link";
import { LogoMark } from "@/components/ui/logo-mark";
import { getServerLocale } from "@/i18n/server";

export default async function UnauthorizedPage() {
  const locale = await getServerLocale();
  return (
    <main className="min-h-[calc(100vh-5rem)] px-5 py-12 sm:px-8">
      <div className="mx-auto grid max-w-5xl items-center gap-10 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-glass)] p-7 shadow-[var(--shadow-elevated)] backdrop-blur-[var(--blur-glass)] sm:p-12 md:grid-cols-[0.7fr_1.3fr]">
        <div className="grid size-40 place-items-center rounded-full bg-[var(--color-brand-secondary)] sm:size-56">
          <LogoMark size={90} />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--color-danger)]">
            403 ·{" "}
            {locale === "ar"
              ? "الوصول مرفوض"
              : locale === "it"
                ? "Accesso negato"
                : "Access denied"}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            {locale === "ar"
              ? "هذه المساحة ليست ضمن دورك."
              : locale === "it"
                ? "Questa area non appartiene al tuo ruolo."
                : "This area is not available for your role."}
          </h1>
          <p className="mt-5 max-w-xl leading-8 text-[var(--color-text-secondary)]">
            {locale === "ar"
              ? "يمكنك العودة إلى لوحة الإدارة أو تسجيل الخروج والتواصل مع المالك إذا كنت تحتاج إلى صلاحية إضافية."
              : locale === "it"
                ? "Puoi tornare alla dashboard o accedere con un altro account se hai bisogno di permessi aggiuntivi."
                : "Return to the dashboard or sign in with another account if you need additional access."}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-pill)] bg-[var(--color-brand-secondary)] px-5 text-sm font-semibold text-[var(--color-on-brand)]"
              href="/admin"
            >
              {locale === "ar"
                ? "العودة للوحة الإدارة"
                : locale === "it"
                  ? "Torna alla dashboard"
                  : "Back to dashboard"}
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-pill)] border border-[var(--color-border-strong)] px-5 text-sm font-semibold text-[var(--color-text-secondary)]"
              href="/admin/login"
            >
              {locale === "ar"
                ? "تسجيل الخروج والدخول بحساب آخر"
                : locale === "it"
                  ? "Accedi con un altro account"
                  : "Sign in with another account"}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
