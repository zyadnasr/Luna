"use client";

import { useState, useTransition } from "react";
import { saveAnalyticsSettings, type AnalyticsSettings } from "@/lib/analytics/config";

export function AnalyticsSettingsForm({ initial }: { initial: AnalyticsSettings }) {
  const [settings, setSettings] = useState(initial);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const update = (key: keyof AnalyticsSettings, value: string | boolean) =>
    setSettings((current) => ({ ...current, [key]: value }));
  return (
    <form
      className="grid gap-5"
      action={() => {
        setMessage("");
        startTransition(async () => {
          const result = await saveAnalyticsSettings(settings);
          setMessage(result.message);
        });
      }}
    >
      <label className="flex items-center justify-between gap-4 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm font-semibold">
        <span>
          Enable marketing analytics
          <span className="mt-1 block text-xs font-normal text-[var(--color-text-muted)]">
            Sends first-party events to this dashboard and the configured pixels.
          </span>
        </span>
        <input
          checked={settings.enabled}
          className="size-5 accent-[var(--color-brand-primary)]"
          onChange={(event) => update("enabled", event.target.checked)}
          type="checkbox"
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Google Analytics 4 Measurement ID
        <input
          className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-input)] px-4 py-3 font-mono text-sm outline-none focus:border-[var(--color-brand-primary)]"
          onChange={(event) => update("googleMeasurementId", event.target.value)}
          placeholder="G-XXXXXXXXXX"
          value={settings.googleMeasurementId}
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Meta Pixel ID
        <input
          className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-input)] px-4 py-3 font-mono text-sm outline-none focus:border-[var(--color-brand-primary)]"
          onChange={(event) => update("metaPixelId", event.target.value)}
          placeholder="123456789012345"
          value={settings.metaPixelId}
        />
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <button
          className="rounded-[var(--radius-pill)] bg-[var(--color-brand-primary)] px-5 py-3 text-sm font-semibold text-[var(--color-brand-on-primary)] disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Saving…" : "Save analytics settings"}
        </button>
        {message ? <span className="text-sm text-[var(--color-text-muted)]">{message}</span> : null}
      </div>
    </form>
  );
}
