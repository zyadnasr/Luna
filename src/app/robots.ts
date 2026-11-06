import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/auth", "/checkout", "/order", "/design-system", "/health"],
    },
    sitemap: new URL("/sitemap.xml", getSiteUrl()).toString(),
    host: getSiteUrl().toString().replace(/\/$/, ""),
  };
}
