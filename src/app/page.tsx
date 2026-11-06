import { HomePage } from "@/components/home/home-page";
import { getHomepageSettings } from "@/lib/site/homepage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Healthy Cookies & Desserts in Cairo",
  description:
    "Discover Luna Healthy: carefully made cookies and desserts, with menu ordering and delivery across Cairo.",
  alternates: { canonical: "/" },
};

export const dynamic = "force-dynamic";

export default async function Home() {
  const media = await getHomepageSettings();
  return <HomePage media={media} />;
}
