import type { ReactNode } from "react";
import { getNoIndexMetadata } from "@/lib/seo";

export const metadata = getNoIndexMetadata(
  "Health check | Luna Healthy",
  "Internal application health check.",
);

export default function HealthLayout({ children }: { children: ReactNode }) {
  return children;
}
