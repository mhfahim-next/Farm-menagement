/** Public site URL (set NEXT_PUBLIC_SITE_URL in production, e.g. https://farmflows.app). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
export const SITE_NAME = "FarmFlows";

/**
 * Canonical + hreflang for a public page. English lives at the plain path,
 * Bangla at `?lang=bn` (see the proxy), so search engines index both.
 */
export function langAlternates(path: string, locale: "en" | "bn") {
  const bn = `${path}?lang=bn`;
  return {
    canonical: locale === "bn" ? bn : path,
    languages: { en: path, bn, "x-default": path },
  };
}
