import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "@/styles/tokens.css";
import { AppShell } from "@/components/app-shell";
import { CartProvider } from "@/components/orders/cart-provider";
import { LocaleProvider } from "@/components/ui/locale-provider";
import { SplashScreen } from "@/components/ui/splash-screen";

export const metadata: Metadata = {
  title: "Luna Healthy",
  description: "Operations foundation for Luna Healthy.",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ar" dir="rtl" className="h-full antialiased">
      <body className="min-h-full">
        <LocaleProvider>
          <SplashScreen />
          <CartProvider>
            <AppShell>{children}</AppShell>
          </CartProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
