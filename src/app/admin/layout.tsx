import type { ReactNode } from "react";
import { getNoIndexMetadata } from "@/lib/seo";

export const metadata = getNoIndexMetadata(
  "Admin workspace | Luna Healthy",
  "Private Luna Healthy administration workspace.",
);

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
