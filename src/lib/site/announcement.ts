"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";

export type AnnouncementSettings = {
  enabled: boolean;
  ar: string;
  en: string;
  it: string;
};

const emptyAnnouncement: AnnouncementSettings = { enabled: false, ar: "", en: "", it: "" };

export async function getAnnouncementSettings(): Promise<AnnouncementSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "announcement_banner")
    .eq("is_public", true)
    .maybeSingle();
  const value = data?.value;
  if (!value || typeof value !== "object") return emptyAnnouncement;
  const record = value as Record<string, unknown>;
  return {
    enabled: record.enabled === true,
    ar: typeof record.ar === "string" ? record.ar : "",
    en: typeof record.en === "string" ? record.en : "",
    it: typeof record.it === "string" ? record.it : "",
  };
}

export async function saveAnnouncementSettings(settings: AnnouncementSettings) {
  const user = await requireRole("owner");
  const supabase = await createClient();
  const announcement = {
    enabled: settings.enabled,
    ar: settings.ar.trim(),
    en: settings.en.trim(),
    it: settings.it.trim(),
  };
  if (
    Object.values(announcement).some((value) => typeof value === "string" && value.length > 180)
  ) {
    return { success: false, message: "نص الإعلان يجب ألا يتجاوز 180 حرفًا." };
  }

  const { error } = await supabase.from("app_settings").upsert(
    {
      key: "announcement_banner",
      value: announcement,
      description: "Owner-configured public announcement banner.",
      is_public: true,
    },
    { onConflict: "key" },
  );
  if (error) return { success: false, message: "تعذر حفظ شريط الإعلان." };

  await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    action: "settings.announcement_updated",
    entity_type: "app_setting",
    entity_id: null,
    metadata: { key: "announcement_banner", enabled: announcement.enabled },
  });
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  return { success: true, message: "تم حفظ شريط الإعلان." };
}
