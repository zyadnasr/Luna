import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl().toString().replace(/\/$/, "");
  const now = new Date();

  return [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
      images: [`${siteUrl}/assets/hero.jpg`, `${siteUrl}/assets/logo-circule.png`],
    },
    {
      url: `${siteUrl}/menu`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
      images: [`${siteUrl}/assets/menu-en.jpeg`, `${siteUrl}/assets/hero.jpg`],
    },
  ];
}
