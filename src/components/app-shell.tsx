import type { ReactNode } from "react";
import { Footer } from "./footer";
import { PublicHeader } from "./public-header";
import { AnnouncementBar } from "./announcement-bar";
import { getAnnouncementSettings } from "@/lib/site/announcement";

export async function AppShell({ children }: { children: ReactNode }) {
  const announcement = await getAnnouncementSettings();
  return (
    <div className="flex min-h-screen flex-col">
      <a className="skip-link" href="#main-content">
        تخطى إلى المحتوى
      </a>
      <AnnouncementBar settings={announcement} />
      <PublicHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
