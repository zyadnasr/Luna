"use client";

export function PrintInvoiceButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-[var(--radius-pill)] bg-[var(--color-brand-primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 print:hidden"
    >
      {label}
    </button>
  );
}
