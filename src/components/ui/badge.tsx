import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--radius-pill)] border border-[var(--color-border)] px-3 py-1 text-xs font-semibold text-[var(--color-text-secondary)]",
        className,
      )}
      {...props}
    />
  );
}
