"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

const THEME_CHANGE_EVENT = "luna-theme-change";

function getStoredTheme() {
  const saved = localStorage.getItem("luna-theme");
  return saved === "dark" || (!saved && matchMedia("(prefers-color-scheme: dark)").matches);
}

function subscribeToTheme(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(THEME_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(THEME_CHANGE_EVENT, callback);
  };
}

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribeToTheme, getStoredTheme, () => false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const toggle = useCallback(() => {
    const next = !dark;
    localStorage.setItem("luna-theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }, [dark]);
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "تفعيل الوضع النهاري" : "تفعيل الوضع الليلي"}
      className="grid size-11 place-items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-glass)] text-base transition hover:-translate-y-0.5"
    >
      <span aria-hidden="true">{dark ? "☼" : "◐"}</span>
    </button>
  );
}
