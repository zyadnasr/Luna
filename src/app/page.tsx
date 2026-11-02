import { HomePage } from "@/components/home/home-page";
import { getHomepageSettings } from "@/lib/site/homepage";

export const dynamic = "force-dynamic";

export default async function Home() {
  const media = await getHomepageSettings();
  return <HomePage media={media} />;
}
