"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";

export type HomepageImage = {
  src: string;
  alt: string;
};

export type HomepageSettings = {
  hero: HomepageImage;
  gallery: [HomepageImage, HomepageImage, HomepageImage, HomepageImage];
};

const defaultHomepageSettings: HomepageSettings = {
  hero: { src: "/assets/menu-en.jpeg", alt: "Luna Healthy cookies" },
  gallery: [
    { src: "/assets/menu-en.jpeg", alt: "Luna cookie details" },
    { src: "/assets/menu-en.jpeg", alt: "Luna collection" },
    { src: "/assets/cookies-cutout.png", alt: "Luna cookies" },
    { src: "/assets/menu-en.jpeg", alt: "Luna baking details" },
  ],
};

function readImage(value: unknown, fallback: HomepageImage): HomepageImage {
  if (!value || typeof value !== "object") return fallback;
  const image = value as Record<string, unknown>;
  return {
    src: typeof image.src === "string" && image.src.trim() ? image.src.trim() : fallback.src,
    alt: typeof image.alt === "string" && image.alt.trim() ? image.alt.trim() : fallback.alt,
  };
}

export async function getHomepageSettings(): Promise<HomepageSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "homepage_media")
    .eq("is_public", true)
    .maybeSingle();
  if (!data?.value || typeof data.value !== "object") return defaultHomepageSettings;

  const value = data.value as Record<string, unknown>;
  const gallery = Array.isArray(value.gallery) ? value.gallery : [];
  return {
    hero: readImage(value.hero, defaultHomepageSettings.hero),
    gallery: [0, 1, 2, 3].map((index) =>
      readImage(gallery[index], defaultHomepageSettings.gallery[index]),
    ) as HomepageSettings["gallery"],
  };
}

function isValidImageSource(src: string) {
  return src.startsWith("/") || src.startsWith("https://") || src.startsWith("http://");
}

export async function saveHomepageSettings(settings: HomepageSettings) {
  const user = await requireRole("owner");
  const supabase = await createClient();
  const images = [settings.hero, ...settings.gallery].map((image) => ({
    src: image.src.trim(),
    alt: image.alt.trim(),
  }));
  if (
    images.some(
      (image) =>
        !isValidImageSource(image.src) ||
        !image.alt ||
        image.src.length > 500 ||
        image.alt.length > 160,
    )
  ) {
    return { success: false, message: "أدخل روابط صور صحيحة ووصفًا مختصرًا لكل صورة." };
  }

  const value: HomepageSettings = {
    hero: images[0],
    gallery: images.slice(1) as HomepageSettings["gallery"],
  };
  const { error } = await supabase.from("app_settings").upsert(
    {
      key: "homepage_media",
      value,
      description: "Owner-configured hero and gallery images for the public homepage.",
      is_public: true,
    },
    { onConflict: "key" },
  );
  if (error) return { success: false, message: "تعذر حفظ صور الصفحة الرئيسية." };

  await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    action: "settings.homepage_media_updated",
    entity_type: "app_setting",
    entity_id: null,
    metadata: { key: "homepage_media" },
  });
  revalidatePath("/");
  revalidatePath("/admin/settings");
  return { success: true, message: "تم حفظ صور الصفحة الرئيسية." };
}
