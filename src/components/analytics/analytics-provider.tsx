"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import type { AnalyticsSettings } from "@/lib/analytics/config";

type AnalyticsEvent = {
  eventName: "page_view" | "view_item" | "add_to_cart" | "begin_checkout" | "purchase" | "order_complete" | "cta_click";
  metadata?: Record<string, unknown>;
};

const getSessionId = () => {
  const key = "luna-analytics-session";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const value = window.crypto.randomUUID();
  window.localStorage.setItem(key, value);
  return value;
};

export function trackAnalyticsEvent({ eventName, metadata = {} }: AnalyticsEvent) {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const payload = {
    eventName,
    sessionId: getSessionId(),
    path: window.location.pathname,
    referrer: document.referrer || null,
    utmSource: params.get("utm_source") || window.localStorage.getItem("luna-utm-source"),
    utmMedium: params.get("utm_medium") || window.localStorage.getItem("luna-utm-medium"),
    utmCampaign: params.get("utm_campaign") || window.localStorage.getItem("luna-utm-campaign"),
    utmContent: params.get("utm_content") || window.localStorage.getItem("luna-utm-content"),
    utmTerm: params.get("utm_term") || window.localStorage.getItem("luna-utm-term"),
    gclid: params.get("gclid") || window.localStorage.getItem("luna-gclid"),
    fbclid: params.get("fbclid") || window.localStorage.getItem("luna-fbclid"),
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
    if (!settings.enabled) return;
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
