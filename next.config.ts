import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      pdfkit: path.resolve(process.cwd(), "node_modules/pdfkit/js/pdfkit.browser.js"),
    };
    return config;
  },
  cacheComponents: false,
  partialPrefetching: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "orpwnibhukgzdnikwiao.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  experimental: {
    serverActions: {
      // The UI accepts images up to 5 MB. Keep room for the multipart request
      // envelope while the action validates the actual file size server-side.
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
