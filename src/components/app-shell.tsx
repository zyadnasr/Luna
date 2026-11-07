import type { ReactNode } from "react";
import { Footer } from "./footer";
import { PublicHeader } from "./public-header";
import { AnnouncementBar } from "./announcement-bar";
import { getAnnouncementSettings } from "@/lib/site/announcement";
import { getAnalyticsSettings } from "@/lib/analytics/config";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";

export async function AppShell({ children }: { children: ReactNode }) {
  const [announcement, analytics] = await Promise.all([
    getAnnouncementSettings(),
    getAnalyticsSettings(),
  ]);
  return (
    <div className="flex min-h-screen flex-col">
      <a className="skip-link" href="#main-content">
        تخطى إلى المحتوى
      </a>
      <AnnouncementBar settings={announcement} />
      <AnalyticsProvider settings={analytics} />
      <PublicHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
