import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: false,
  partialPrefetching: false,
  experimental: {
    serverActions: {
      // The UI accepts images up to 5 MB. Keep room for the multipart request
      // envelope while the action validates the actual file size server-side.
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
