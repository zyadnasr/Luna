import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "min-h-11 w-full rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 text-[var(--color-text-primary)] focus:border-[var(--color-brand-primary)] focus:outline-none",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
