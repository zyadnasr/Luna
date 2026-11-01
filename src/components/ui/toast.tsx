"use client";

import type { ReactNode } from "react";

export function Toast({ children, onClose }: { children: ReactNode; onClose?: () => void }) {
  return (
    <div
      className="flex items-center justify-between gap-4 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-3 text-sm shadow-[var(--shadow-soft)]"
      role="status"
    >
      {children}
      {onClose ? (
        <button type="button" onClick={onClose} aria-label="Close notification">
          ×
        </button>
      ) : null}
    </div>
  );
}
