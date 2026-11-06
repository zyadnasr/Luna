import type { ReactNode } from "react";
import { getNoIndexMetadata } from "@/lib/seo";

export const metadata = getNoIndexMetadata(
  "Checkout | Luna Healthy",
  "Secure checkout for Luna Healthy orders.",
);

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return children;
}
