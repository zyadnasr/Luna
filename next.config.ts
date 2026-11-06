import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: false,
  partialPrefetching: false,
  experimental: {
    serverActions: {
      // Keep room for multipart boundaries while allowing a normal multi-image upload.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
