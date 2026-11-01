export const siteConfig = {
  name: "Luna Healthy",
  description: "Operations foundation for Luna Healthy.",
  defaultLocale: "ar" as const,
  locales: ["ar", "en", "it"] as const,
};

export type Locale = (typeof siteConfig.locales)[number];
