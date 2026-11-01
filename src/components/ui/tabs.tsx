"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { cn } from "@/lib/cn";

export function Tabs({ items }: { items: Array<{ label: string; content: ReactNode }> }) {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div className="flex gap-1 border-b border-[var(--color-border)]" role="tablist">
        {items.map((item, index) => (
          <button
            type="button"
            role="tab"
            aria-selected={active === index}
            className={cn(
              "border-b-2 px-4 py-3 text-sm",
              active === index
                ? "border-[var(--color-brand-primary)] font-semibold"
                : "border-transparent text-[var(--color-text-muted)]",
            )}
            onClick={() => setActive(index)}
            key={item.label}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="pt-5">{items[active]?.content}</div>
    </div>
  );
}
