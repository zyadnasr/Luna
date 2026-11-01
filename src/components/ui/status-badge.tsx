import type { ReactNode } from "react";
import { Badge } from "./badge";
import { cn } from "@/lib/cn";

type Status = "success" | "warning" | "danger" | "info";
const colors: Record<Status, string> = {
  success: "border-[var(--color-success)]/30 text-[var(--color-success)]",
  warning: "border-[var(--color-warning)]/30 text-[var(--color-warning)]",
  danger: "border-[var(--color-danger)]/30 text-[var(--color-danger)]",
  info: "border-[var(--color-info)]/30 text-[var(--color-info)]",
};
export function StatusBadge({ status, children }: { status: Status; children: ReactNode }) {
  return (
    <Badge className={cn(colors[status])}>
      <span
        className={cn(
          "me-2 size-1.5 rounded-full",
          status === "success"
            ? "bg-[var(--color-success)]"
            : status === "warning"
              ? "bg-[var(--color-warning)]"
              : status === "danger"
                ? "bg-[var(--color-danger)]"
                : "bg-[var(--color-info)]",
        )}
        aria-hidden="true"
      />
      {children}
    </Badge>
  );
}
