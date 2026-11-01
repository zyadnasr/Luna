import Link from "next/link";
import { LogoMark } from "@/components/ui/logo-mark";

export default function NotFound() {
  return (
    <main className="min-h-[70vh] px-5 py-16">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto grid size-24 place-items-center rounded-full bg-[rgba(128,128,96,0.12)]">
          <LogoMark size={58} />
        </div>
        <p className="mt-8 text-sm font-semibold text-[var(--color-text-muted)]">404</p>
        <h1 className="mt-3 text-4xl font-semibold">الصفحة غير موجودة</h1>
        <p className="mt-4 leading-7 text-[var(--color-text-muted)]">
          يبدو أن هذا العنوان ليس ضمن مساحة Luna الحالية.
        </p>
        <Link
          className="mt-8 inline-flex min-h-11 items-center rounded-[var(--radius-pill)] bg-[var(--color-brand-secondary)] px-5 text-sm font-semibold text-[var(--color-on-brand)]"
          href="/"
        >
          العودة للرئيسية
        </Link>
      </div>
    </main>
  );
}
