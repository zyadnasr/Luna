import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[rgba(255,253,245,0.5)] p-8 text-center">
      <div
        className="mx-auto grid size-12 place-items-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-focus)] text-xl font-semibold text-[var(--color-text-primary)] shadow-[var(--shadow-card)]"
        aria-hidden="true"
      >
        ＋
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-text-muted)]">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
