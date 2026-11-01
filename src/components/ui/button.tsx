import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant };

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-brand-secondary)] text-[var(--color-on-brand)] shadow-[var(--shadow-soft)] hover:-translate-y-0.5 hover:bg-[var(--color-brand-primary-deep)]",
  secondary:
    "border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:-translate-y-0.5 hover:border-[var(--color-brand-primary)]",
  ghost:
    "text-[var(--color-text-secondary)] hover:bg-[var(--color-nav-active-bg)] hover:text-[var(--color-nav-active-text)]",
};

export function Button({ className, variant = "primary", type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-[var(--radius-pill)] px-5 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
