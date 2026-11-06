import type { ReactNode } from "react";
import { getNoIndexMetadata } from "@/lib/seo";

export const metadata = getNoIndexMetadata(
  "Place an order | Luna Healthy",
  "Private order flow for Luna Healthy customers.",
);

export default function OrderLayout({ children }: { children: ReactNode }) {
  return children;
}
