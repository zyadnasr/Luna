"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

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

const maxImageSize = 5 * 1024 * 1024;
const allowedImageTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function saveHomepageMedia(formData: FormData) {
  const user = await requireRole("owner");
  const supabase = await createClient();
  const service = createServiceClient();
  const current = await getHomepageSettings();
  const entries = [
    { fileKey: "hero_file", altKey: "hero_alt", current: current.hero },
    ...current.gallery.map((image, index) => ({
      fileKey: `gallery_${index}_file`,
      altKey: `gallery_${index}_alt`,
      current: image,
    })),
  ];
  const images: HomepageImage[] = [];

  for (const entry of entries) {
    const alt = String(formData.get(entry.altKey) ?? "").trim();
    if (!alt || alt.length > 160) {
      return { success: false, message: "اكتب وصفًا مختصرًا وصحيحًا لكل صورة." };
    }

    const value = formData.get(entry.fileKey);
    const file = value instanceof File && value.size > 0 ? value : null;
    let src = entry.current.src;
    if (file) {
      if (!allowedImageTypes.has(file.type) || file.size > maxImageSize) {
        return { success: false, message: "استخدم PNG أو JPG أو WEBP بحجم أقل من 5 ميجابايت." };
      }
      const path = `homepage/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
      const { error: uploadError } = await service.storage
        .from("homepage-media")
        .upload(path, file, { cacheControl: "31536000", contentType: file.type, upsert: false });
      if (uploadError) return { success: false, message: "تعذر رفع إحدى الصور." };
      src = service.storage.from("homepage-media").getPublicUrl(path).data.publicUrl;
    }
    images.push({ src, alt });
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
