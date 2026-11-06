import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "@/styles/tokens.css";
import { AppShell } from "@/components/app-shell";
import { CartProvider } from "@/components/orders/cart-provider";
import { LocaleProvider } from "@/components/ui/locale-provider";
import { SplashScreen } from "@/components/ui/splash-screen";
import { getServerLocale } from "@/i18n/server";
import { getSiteMetadata } from "@/lib/seo";
import { SiteJsonLd } from "@/components/seo/site-json-ld";

export const metadata: Metadata = getSiteMetadata("en");

type RootLayoutProps = {
  children: ReactNode;
};

export default async function RootLayout({ children }: RootLayoutProps) {
  const locale = await getServerLocale();
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className="h-full antialiased">
      <body className="min-h-full">
        <SiteJsonLd />
        <LocaleProvider initialLocale={locale}>
          <SplashScreen />
          <CartProvider>
            <AppShell>{children}</AppShell>
          </CartProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
