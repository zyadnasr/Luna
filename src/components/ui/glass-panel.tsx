import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function GlassPanel({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn(
        "rounded-[var(--radius-lg)] border border-white/75 bg-[var(--color-surface-glass)] p-6 shadow-[var(--shadow-soft)] backdrop-blur-[var(--blur-glass)]",
        className,
      )}
      {...props}
    />
  );
}
