"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export function DemoControls() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setOpen(true)}>Open modal</Button>
        <Button variant="secondary">Secondary action</Button>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Visual example">
        <p className="text-[var(--color-text-muted)]">
          This modal is a visual-only design system example.
        </p>
        <div className="mt-5">
          <Button onClick={() => setOpen(false)}>Close</Button>
        </div>
      </Modal>
    </>
  );
}
