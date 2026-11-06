import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Luna Healthy",
    short_name: "Luna",
    description: "Healthy cookies and desserts from Luna Healthy, with delivery across Cairo.",
    start_url: "/",
    display: "standalone",
    background_color: "#24231f",
    theme_color: "#24231f",
    icons: [
      {
        src: "/assets/logo-circule.png",
        sizes: "1080x1080",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
