import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-12 w-full rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] transition duration-200 hover:border-[var(--color-brand-primary)] focus:border-[var(--color-brand-primary)] focus:bg-[var(--color-surface-focus)] focus:outline-none focus:ring-4 focus:ring-[var(--color-focus-ring)]",
        className,
      )}
      {...props}
    />
  );
}
