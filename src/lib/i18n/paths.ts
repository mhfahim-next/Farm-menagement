// Language in the address of public pages (safe in client and server code).
//
// English pages have no prefix (/blog) and Bangla pages live under /bn
// (/bn/blog). Signed-in parts of the site (dashboard, admin, the vet console…)
// and files/APIs have one address for both languages; there the language comes
// from the saved cookie.

import type { Locale } from "./core";

/** First path segments that are not public pages (same address in both languages). */
const APP_ROOTS = new Set(["dashboard", "admin", "onboarding", "suspended", "invites", "doctor", "api", "auth", "_next", "monitoring"]);

/** Public pages under an app root. */
const SITE_EXCEPTIONS = new Set(["/doctor/signup"]);

/** Path without query or hash. */
const pathOnly = (href: string) => href.split(/[?#]/)[0] || "/";

/** True for public pages, which exist in both languages (/x and /bn/x). */
export function isSitePath(href: string) {
  const path = pathOnly(href);
  if (!path.startsWith("/") || path.startsWith("//")) return false;
  if (SITE_EXCEPTIONS.has(path.replace(/\/$/, ""))) return true;
  const first = path.split("/")[1] ?? "";
  if (APP_ROOTS.has(first)) return false;
  // Files (robots.txt, sitemap.xml, images, the web manifest…).
  const last = path.split("/").pop() ?? "";
  if (last.includes(".")) return false;
  if (first === "opengraph-image" || first === "manifest.webmanifest") return false;
  return true;
}

/** Splits "/bn/blog" into { locale: "bn", path: "/blog" }; other paths are English. */
export function splitLocale(pathname: string): { locale: Locale | null; path: string } {
  const m = /^\/(bn|en)(?=\/|$)(.*)$/.exec(pathname);
  if (!m) return { locale: null, path: pathname };
  return { locale: m[1] as Locale, path: m[2] || "/" };
}

/**
 * The address of a page in a language: "/blog" → "/bn/blog" in Bangla, "/" → "/bn".
 * Anything that is not a public page (dashboard, files, other sites) is unchanged.
 */
export function localePath(href: string, locale: Locale) {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const { path: bare } = splitLocale(pathOnly(href));
  const rest = href.slice(pathOnly(href).length);
  if (!isSitePath(bare)) return href;
  if (locale !== "bn") return bare + rest;
  return (bare === "/" ? "/bn" : `/bn${bare}`) + rest;
}

/** Browser only: remembers a language choice for the signed-in app (cookie). */
export function rememberLocale(locale: Locale) {
  document.cookie = `locale=${locale}; path=/; max-age=31536000; samesite=lax`;
}
