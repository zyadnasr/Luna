import type { ReactNode } from "react";
import { getNoIndexMetadata } from "@/lib/seo";

export const metadata = getNoIndexMetadata(
  "Authentication | Luna Healthy",
  "Private authentication flow for Luna Healthy.",
);

export default function AuthLayout({ children }: { children: ReactNode }) {
  return children;
}
