"use client";

import { useEffect, useState } from "react";
import { useLocale } from "./locale-provider";

const SPLASH_DURATION = 2600;
const EXIT_DURATION = 420;

export function SplashScreen() {
  const { locale } = useLocale();
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem("luna-theme");
    if (storedTheme === "dark" || storedTheme === "light") {
      document.documentElement.classList.toggle("dark", storedTheme === "dark");
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const exitDuration = reducedMotion ? 0 : EXIT_DURATION;
    const splashDuration = reducedMotion ? 80 : SPLASH_DURATION;

    let exitTimer: number | undefined;
    const hideSplash = () => {
      setIsExiting(true);
      exitTimer = window.setTimeout(() => setIsVisible(false), exitDuration);
    };

    // Do not wait for window.load: a slow or stuck resource must not leave
    // the splash screen covering the application indefinitely on mobile.
    const timer = window.setTimeout(hideSplash, splashDuration);

    return () => {
      window.clearTimeout(timer);
      if (exitTimer !== undefined) window.clearTimeout(exitTimer);
    };
  }, []);

  if (!isVisible) return null;

  const greeting = locale === "it" ? "ciao" : "hello";

  return (
    <div
      aria-label="Luna"
      aria-live="polite"
      className={`luna-splash ${isExiting ? "luna-splash--exiting" : ""}`}
      role="status"
    >
      <div aria-hidden="true" className="luna-splash__halo" />
      <div className="luna-splash__content">
        <p className="luna-splash__greeting">{greeting}</p>
        <div className="luna-splash__wordmark">Luna</div>
        <span aria-hidden="true" className="luna-splash__stroke" />
      </div>
    </div>
  );
}
