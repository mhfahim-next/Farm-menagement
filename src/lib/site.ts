/**
 * Normalises a site address from the environment: tolerates a missing
 * "https://", spaces and trailing slashes ("farmflows.app" → "https://farmflows.app").
 * Falls back when the value is empty or not a valid URL, so a typo can never
 * take the whole site down.
 */
export function normalizeSiteUrl(raw: string | undefined, fallback = "http://localhost:3000") {
  const v = (raw ?? "").trim().replace(/\/+$/, "");
  if (!v) return fallback;
  const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    return new URL(withScheme).origin;
  } catch {
    return fallback;
  }
}

/** Public site URL (set NEXT_PUBLIC_SITE_URL in production, e.g. https://www.farmflows.app). */
export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
export const SITE_NAME = "FarmFlows";

/**
 * Canonical + hreflang for a public page. English lives at the plain path,
 * Bangla at `?lang=bn` (see the proxy), so search engines index both.
 */
export function langAlternates(path: string, locale: "en" | "bn") {
  const bn = `${path}${path.includes("?") ? "&" : "?"}lang=bn`;
  return {
    canonical: locale === "bn" ? bn : path,
    languages: { en: path, bn, "x-default": path },
  };
}

/**
 * Search Console / Bing give a whole `<meta name="…" content="TOKEN" />` tag, but only the
 * token belongs in the env var. Accept either, so a pasted tag still produces a valid one.
 */
export function verificationToken(raw: string | undefined) {
  if (!raw) return undefined;
  const fromTag = /content\s*=\s*["']?([^"'\s>]+)/i.exec(raw)?.[1];
  const token = (fromTag ?? raw).trim().replace(/^["']+|["']+$/g, "").replace(/^[\w.-]*verification=/i, "");
  return /^[\w-]{10,200}$/.test(token) ? token : undefined;
}
