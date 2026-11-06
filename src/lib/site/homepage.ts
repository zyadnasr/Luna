"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type HomepageImage = {
  src: string;
  alt: string;
};

export type GalleryArrangement = "row" | "coverflow" | "grid" | "barrel" | "helix" | "sphere";

export type HomepageSettings = {
  hero: HomepageImage;
  gallery: HomepageImage[];
  galleryArrangement: GalleryArrangement;
};

const defaultHomepageSettings: HomepageSettings = {
  hero: { src: "/assets/menu-en.jpeg", alt: "Luna Healthy cookies" },
  gallery: [
    { src: "/assets/menu-en.jpeg", alt: "Luna cookie details" },
    { src: "/assets/menu-en.jpeg", alt: "Luna collection" },
    { src: "/assets/cookies-cutout.png", alt: "Luna cookies" },
    { src: "/assets/menu-en.jpeg", alt: "Luna baking details" },
  ],
  galleryArrangement: "coverflow",
};

function readImage(value: unknown, fallback: HomepageImage): HomepageImage {
  if (!value || typeof value !== "object") return fallback;
  const image = value as Record<string, unknown>;
  return {
    src: typeof image.src === "string" && image.src.trim() ? image.src.trim() : fallback.src,
    alt: typeof image.alt === "string" && image.alt.trim() ? image.alt.trim() : fallback.alt,
  };
}

function parseHomepageSettings(value: unknown): HomepageSettings {
  if (!value || typeof value !== "object") return defaultHomepageSettings;

  const record = value as Record<string, unknown>;
  const gallery = Array.isArray(record.gallery) ? record.gallery : [];
  const configuredGallery = gallery
    .map((image, index) =>
      readImage(
        image,
        defaultHomepageSettings.gallery[index] ?? defaultHomepageSettings.gallery[0],
      ),
    )
    .filter((image) => image.src.trim());
  const galleryArrangement = record.galleryArrangement;

  return {
    hero: readImage(record.hero, defaultHomepageSettings.hero),
    gallery: configuredGallery.length ? configuredGallery : defaultHomepageSettings.gallery,
    galleryArrangement:
      galleryArrangement === "row" ||
      galleryArrangement === "grid" ||
      galleryArrangement === "barrel" ||
      galleryArrangement === "helix" ||
      galleryArrangement === "sphere"
        ? galleryArrangement
        : "coverflow",
  };
}

export async function getHomepageSettings(): Promise<HomepageSettings> {
  const service = createServiceClient();
  const { data } = await service
    .from("app_settings")
    .select("value")
    .eq("key", "homepage_media")
    .eq("is_public", true)
    .maybeSingle();
  return parseHomepageSettings(data?.value);
}

const maxImageSize = 5 * 1024 * 1024;
const allowedImageTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function saveHomepageMedia(formData: FormData) {
  const user = await requireRole("owner");
  const supabase = await createClient();
  const service = createServiceClient();
  const { data: storedSettings, error: readError } = await service
    .from("app_settings")
    .select("value")
    .eq("key", "homepage_media")
    .maybeSingle();
  if (readError) {
    return {
      success: false,
      message: "تعذر قراءة صور الصفحة الحالية، لذلك لم يتم حفظ التعديلات حتى لا تُستبدل الصور.",
    };
  }
  const current = parseHomepageSettings(storedSettings?.value);
  const requestedGalleryCount = Math.min(
    Math.max(Number(formData.get("gallery_count") ?? current.gallery.length), 1),
    12,
  );
  const entries = [
    { fileKey: "hero_file", altKey: "hero_alt", current: current.hero, required: true },
    ...Array.from({ length: requestedGalleryCount }, (_, index) => ({
      fileKey: `gallery_${index}_file`,
      altKey: `gallery_${index}_alt`,
      current: current.gallery[index] ?? null,
      required: false,
    })),
  ];
  const images: HomepageImage[] = [];
  const galleryArrangement = String(formData.get("gallery_arrangement") ?? "coverflow");

  for (const entry of entries) {
    const submittedAlt = String(formData.get(entry.altKey) ?? "").trim();
    const value = formData.get(entry.fileKey);
    const file = value instanceof File && value.size > 0 ? value : null;
    const generatedAlt = file
      ? file.name
          .replace(/\.[^.]+$/, "")
          .replace(/[-_]+/g, " ")
          .trim()
      : "";
    const alt = submittedAlt || entry.current?.alt || generatedAlt;
    if (entry.required && (!alt || alt.length > 160)) {
      return { success: false, message: "اكتب وصفًا مختصرًا وصحيحًا لكل صورة." };
    }
    if (!entry.required && !entry.current && !file) continue;
    if (file && (!alt || alt.length > 160)) {
      return { success: false, message: "اكتب وصفًا مختصرًا وصحيحًا لكل صورة." };
    }

    let src = entry.current?.src ?? "";
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
    gallery: images.slice(1),
    galleryArrangement:
      galleryArrangement === "row" ||
      galleryArrangement === "grid" ||
      galleryArrangement === "barrel" ||
      galleryArrangement === "helix" ||
      galleryArrangement === "sphere"
        ? galleryArrangement
        : "coverflow",
  };
  const { error } = await service.from("app_settings").upsert(
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
