import type { Metadata } from "next";
import type { Locale } from "@/config/site";

const fallbackSiteUrl = "https://luna-hazel-ten.vercel.app";

export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  return new URL(configuredUrl || fallbackSiteUrl);
}

const seoCopy: Record<Locale, { title: string; description: string; keywords: string[] }> = {
  ar: {
    title: "Luna Healthy | كوكيز وحلويات صحية في القاهرة",
    description:
      "كوكيز وحلويات صحية تُحضّر بعناية من Luna Healthy. تصفح المنيو واطلب التوصيل داخل القاهرة.",
    keywords: [
      "كوكيز صحية",
      "حلويات صحية",
      "كوكيز في القاهرة",
      "Luna Healthy",
      "healthy cookies Cairo",
      "healthy desserts Cairo",
    ],
  },
  en: {
    title: "Luna Healthy | Healthy Cookies & Desserts in Cairo",
    description:
      "Carefully made healthy cookies and desserts from Luna Healthy. Browse the menu and order delivery across Cairo.",
    keywords: [
      "healthy cookies Cairo",
      "healthy desserts Cairo",
      "Luna Healthy",
      "healthy bakery Cairo",
      "cookies delivery Cairo",
      "date-sweetened cookies",
    ],
  },
  it: {
    title: "Luna Healthy | Biscotti e dolci salutari al Cairo",
    description:
      "Biscotti e dolci salutari preparati con cura da Luna Healthy. Scopri il menu e ordina la consegna al Cairo.",
    keywords: [
      "biscotti salutari Cairo",
      "dolci salutari Cairo",
      "Luna Healthy",
      "consegna biscotti Cairo",
    ],
  },
};

export function getSiteMetadata(locale: Locale = "en"): Metadata {
  const copy = seoCopy[locale];
  const siteUrl = getSiteUrl();
  const imageUrl = new URL("/assets/hero.jpg", siteUrl).toString();

  return {
    metadataBase: siteUrl,
    title: {
      default: copy.title,
      template: "%s | Luna Healthy",
    },
    description: copy.description,
    keywords: copy.keywords,
    applicationName: "Luna Healthy",
    authors: [{ name: "Luna Healthy", url: siteUrl.toString() }],
    creator: "Luna Healthy",
    publisher: "Luna Healthy",
    category: "food and beverage",
    classification: "Healthy cookies and desserts",
    referrer: "origin-when-cross-origin",
    formatDetection: {
      telephone: false,
      address: false,
      email: false,
    },
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      url: siteUrl,
      siteName: "Luna Healthy",
      locale: locale === "ar" ? "ar_EG" : locale === "it" ? "it_IT" : "en_US",
      alternateLocale: locale === "ar" ? ["en_US", "it_IT"] : ["ar_EG", "en_US"],
      title: copy.title,
      description: copy.description,
      images: [{ url: imageUrl, width: 2000, height: 2500, alt: "Luna Healthy cookies" }],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.title,
      description: copy.description,
      images: [imageUrl],
    },
    verification: {
      ...(process.env.GOOGLE_SITE_VERIFICATION
        ? { google: process.env.GOOGLE_SITE_VERIFICATION }
        : {}),
      ...(process.env.BING_SITE_VERIFICATION
        ? { other: { "msvalidate.01": process.env.BING_SITE_VERIFICATION } }
        : {}),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    icons: {
      icon: "/assets/logo.ico",
      apple: "/assets/logo-circule.png",
    },
  };
}

export function getNoIndexMetadata(title: string, description: string): Metadata {
  return {
    title,
    description,
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    },
  };
}

export const seoCopyForPages = seoCopy;
