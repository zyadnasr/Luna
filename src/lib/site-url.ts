import "server-only";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

function normalizeUrl(value: string | undefined) {
  if (!value) return null;

  try {
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    url.pathname = url.pathname.replace(/\/$/, "");
    url.search = "";
    url.hash = "";
    return url;
  } catch {
    return null;
  }
}

function isLocalUrl(url: URL) {
  return LOCAL_HOSTS.has(url.hostname.toLowerCase());
}

/**
 * Returns the public origin used in emails and other externally opened links.
 * A local URL must never leak into a production invitation or recovery email.
 */
export function getPublicSiteUrl() {
  const configuredUrl = normalizeUrl(process.env.NEXT_PUBLIC_APP_URL);
  const isProduction = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";

  if (configuredUrl && (!isProduction || !isLocalUrl(configuredUrl))) {
    return configuredUrl;
  }

  if (isProduction) {
    const vercelUrl = normalizeUrl(
      process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL,
    );
    if (vercelUrl && !isLocalUrl(vercelUrl)) return vercelUrl;
  }

  return new URL("http://localhost:3000");
}

export function getPublicSitePath(pathname: string) {
  const url = getPublicSiteUrl();
  url.pathname = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return url.toString();
}
