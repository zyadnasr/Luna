"use client";
import { useState } from "react";
import { completeTransfer } from "@/lib/inventory/actions";
export function TransferActions({ id }: { id: string }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div>
      <button
        type="button"
        disabled={busy}
        className="rounded-[var(--radius-pill)] bg-[var(--color-brand-secondary)] px-3 py-2 text-xs text-[var(--color-on-brand)]"
        onClick={async () => {
          setBusy(true);
          setMessage((await completeTransfer(id)).message);
          setBusy(false);
        }}
      >
        إكمال النقل
      </button>
      {message ? (
        <p className="mt-2 text-xs" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
