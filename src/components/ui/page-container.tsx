import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function PageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-4 py-7 sm:px-8 sm:py-12", className)}>
      {children}
    </div>
  );
}
