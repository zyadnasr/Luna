"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import type { AnalyticsSettings } from "@/lib/analytics/config";

type AnalyticsEvent = {
  eventName: "page_view" | "view_item" | "add_to_cart" | "begin_checkout" | "purchase" | "order_complete" | "cta_click";
  metadata?: Record<string, unknown>;
};

export type StoredAttribution = {
  source: string;
  type: string;
  referrer: string | null;
  landingPage: string;
  sessionId: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  gclid: string | null;
  fbclid: string | null;
};

const getSessionId = () => {
  const key = "luna-analytics-session";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const value = window.crypto.randomUUID();
  window.localStorage.setItem(key, value);
  return value;
};

export function getStoredAttribution(): StoredAttribution {
  if (typeof window === "undefined") {
    return {
      source: "direct",
      type: "direct",
      referrer: null,
      landingPage: "/",
      sessionId: "",
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      utmContent: null,
      utmTerm: null,
      gclid: null,
      fbclid: null,
    };
  }
  const params = new URLSearchParams(window.location.search);
  const stored = (key: string) => window.localStorage.getItem(key);
  const utmSource = params.get("utm_source") || stored("luna-utm-source");
  const gclid = params.get("gclid") || stored("luna-gclid");
  const fbclid = params.get("fbclid") || stored("luna-fbclid");
  const referrer = document.referrer || null;
  const source = utmSource || (gclid ? "google" : fbclid ? "meta" : referrer ? "referral" : "direct");
  const type = utmSource ? "utm" : gclid ? "google_ads" : fbclid ? "meta_ads" : referrer ? "referral" : "direct";
  return {
    source,
    type,
    referrer,
    landingPage: window.location.pathname,
    sessionId: getSessionId(),
    utmSource,
    utmMedium: params.get("utm_medium") || stored("luna-utm-medium"),
    utmCampaign: params.get("utm_campaign") || stored("luna-utm-campaign"),
    utmContent: params.get("utm_content") || stored("luna-utm-content"),
    utmTerm: params.get("utm_term") || stored("luna-utm-term"),
    gclid,
    fbclid,
  };
}

export function trackAnalyticsEvent({ eventName, metadata = {} }: AnalyticsEvent) {
  if (typeof window === "undefined") return;
  const attribution = getStoredAttribution();
  const payload = {
    eventName,
    sessionId: attribution.sessionId,
    path: window.location.pathname,
    referrer: document.referrer || null,
    utmSource: attribution.utmSource,
    utmMedium: attribution.utmMedium,
    utmCampaign: attribution.utmCampaign,
    utmContent: attribution.utmContent,
    utmTerm: attribution.utmTerm,
    gclid: attribution.gclid,
    fbclid: attribution.fbclid,
    metadata,
  };
  void fetch("/api/analytics/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => undefined);

  const w = window as Window & {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  };
  w.gtag?.("event", eventName, metadata);
  w.fbq?.("trackCustom", eventName, metadata);
}

export function AnalyticsProvider({ settings }: { settings: AnalyticsSettings }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousPath = useRef<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const storageMap: Record<string, string> = {
      utm_source: "luna-utm-source",
      utm_medium: "luna-utm-medium",
      utm_campaign: "luna-utm-campaign",
      utm_content: "luna-utm-content",
      utm_term: "luna-utm-term",
      gclid: "luna-gclid",
      fbclid: "luna-fbclid",
    };
    Object.entries(storageMap).forEach(([param, key]) => {
      const value = params.get(param);
      if (value) window.localStorage.setItem(key, value.slice(0, 200));
    });
    if (!settings.enabled) return;

    const w = window as Window & {
      dataLayer?: unknown[];
      gtag?: (...args: unknown[]) => void;
      fbq?: (...args: unknown[]) => void;
    };
    w.dataLayer ??= [];
    if (settings.googleMeasurementId && !document.querySelector("[data-luna-gtag]")) {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(settings.googleMeasurementId)}`;
      script.dataset.lunaGtag = "true";
      document.head.appendChild(script);
      w.gtag = (...args: unknown[]) => w.dataLayer?.push(args);
      w.gtag("js", new Date());
      w.gtag("config", settings.googleMeasurementId, { send_page_view: false });
    }
    if (settings.metaPixelId && !document.querySelector("[data-luna-fbpixel]")) {
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://connect.facebook.net/en_US/fbevents.js";
      script.dataset.lunaFbpixel = "true";
      document.head.appendChild(script);
      w.fbq = (...args: unknown[]) => w.dataLayer?.push(["fbq", ...args]);
      w.fbq("init", settings.metaPixelId);
    }
    if (previousPath.current !== pathname) {
      previousPath.current = pathname;
      trackAnalyticsEvent({ eventName: "page_view", metadata: { title: document.title } });
    }
  }, [pathname, searchParams, settings]);

  return null;
}
