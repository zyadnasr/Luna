"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type AnalyticsSettings = {
  enabled: boolean;
  googleMeasurementId: string;
  metaPixelId: string;
};

const emptySettings: AnalyticsSettings = {
  enabled: false,
  googleMeasurementId: "",
  metaPixelId: "",
};

function parseSettings(value: unknown): AnalyticsSettings {
  if (!value || typeof value !== "object") return emptySettings;
  const record = value as Record<string, unknown>;
  return {
    enabled: record.enabled === true,
    googleMeasurementId:
      typeof record.googleMeasurementId === "string" ? record.googleMeasurementId.trim() : "",
    metaPixelId: typeof record.metaPixelId === "string" ? record.metaPixelId.trim() : "",
  };
}

export async function getAnalyticsSettings(): Promise<AnalyticsSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "analytics_integrations")
    .eq("is_public", true)
    .maybeSingle();
  return parseSettings(data?.value);
}

export async function saveAnalyticsSettings(input: AnalyticsSettings) {
  const user = await requireRole("owner");
  const googleMeasurementId = input.googleMeasurementId.trim().toUpperCase();
  const metaPixelId = input.metaPixelId.trim();
  if (googleMeasurementId && !/^G-[A-Z0-9]+$/.test(googleMeasurementId)) {
    return { success: false, message: "Google Measurement ID must look like G-XXXXXXXXXX." };
  }
  if (metaPixelId && !/^\d{5,20}$/.test(metaPixelId)) {
    return { success: false, message: "Meta Pixel ID must contain digits only." };
  }

  const settings = {
    enabled: input.enabled && Boolean(googleMeasurementId || metaPixelId),
    googleMeasurementId,
    metaPixelId,
  };
  const supabase = await createClient();
  const { error } = await supabase.from("app_settings").upsert(
    {
      key: "analytics_integrations",
      value: settings,
      description: "Owner-configured public analytics identifiers. API secrets stay in environment variables.",
      is_public: true,
    },
    { onConflict: "key" },
  );
  if (error) return { success: false, message: "Unable to save analytics settings." };
  await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    action: "settings.analytics_updated",
    entity_type: "app_setting",
    entity_id: null,
    metadata: { key: "analytics_integrations", enabled: settings.enabled },
  });
  revalidatePath("/", "layout");
  revalidatePath("/admin/analytics");
  return { success: true, message: "Analytics settings saved." };
}

export async function getAnalyticsSnapshot() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("analytics_events")
    .select("event_name, session_id, path, utm_source, utm_medium, utm_campaign, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(10000);
  if (error) throw new Error("Unable to load analytics events.");
  const events = data ?? [];
  const sessions = new Set(events.map((event) => event.session_id).filter(Boolean)).size;
  const count = (name: string) => events.filter((event) => event.event_name === name).length;
  const purchases = events.filter((event) => event.event_name === "purchase");
  const revenue = purchases.reduce((sum, event) => {
    const metadata = event.metadata as Record<string, unknown> | null;
    const value = Number(metadata?.value ?? 0);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);
  const sources = new Map<string, number>();
  const campaigns = new Map<string, number>();
  for (const event of events) {
    const source = event.utm_source || "direct";
    sources.set(source, (sources.get(source) ?? 0) + 1);
    if (event.utm_campaign) campaigns.set(event.utm_campaign, (campaigns.get(event.utm_campaign) ?? 0) + 1);
  }
  const top = (map: Map<string, number>) => [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  return {
    sessions,
    pageViews: count("page_view"),
    addToCart: count("add_to_cart"),
    checkouts: count("begin_checkout"),
    purchases: purchases.length,
    revenue,
    conversionRate: sessions ? (purchases.length / sessions) * 100 : 0,
    sources: top(sources),
    campaigns: top(campaigns),
    recentEvents: events.slice(0, 20),
  };
}
