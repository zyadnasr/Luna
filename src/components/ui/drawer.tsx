"use client";

"use client";

import type { ReactNode } from "react";
export function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-[rgba(48,40,32,0.25)] backdrop-blur-sm"
      role="presentation"
      onMouseDown={onClose}
    >
      <aside
        className="ms-auto h-full w-full max-w-md border-s border-white/70 bg-[var(--color-surface-elevated)] p-6 shadow-[var(--shadow-elevated)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="drawer-title" className="text-xl font-semibold">
            {title}
          </h2>
          <button
            type="button"
            className="rounded-full px-2 text-xl text-[var(--color-text-muted)]"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </aside>
    </div>
  );
}
