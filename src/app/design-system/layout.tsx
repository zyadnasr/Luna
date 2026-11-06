import type { ReactNode } from "react";
import { getNoIndexMetadata } from "@/lib/seo";

export const metadata = getNoIndexMetadata(
  "Design system | Luna Healthy",
  "Internal Luna Healthy design system reference.",
);

export default function DesignSystemLayout({ children }: { children: ReactNode }) {
  return children;
}
