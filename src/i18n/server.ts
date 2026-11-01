import { cookies } from "next/headers";
import type { Locale } from "@/config/site";

export async function getServerLocale(): Promise<Locale> {
  const value = (await cookies()).get("luna-locale")?.value;
  return value === "en" || value === "it" ? value : "ar";
}
