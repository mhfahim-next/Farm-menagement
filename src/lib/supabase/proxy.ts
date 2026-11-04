import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isLocale, LOCALE_COOKIE, type Locale } from "@/lib/i18n/core";
import { isSitePath, localePath, splitLocale } from "@/lib/i18n/paths";
import { normalizeSiteUrl } from "@/lib/site";
import { SUPABASE_KEY, SUPABASE_URL } from "./env";

const PROTECTED_PREFIXES = ["/dashboard", "/onboarding", "/admin", "/suspended", "/doctor", "/invites"];
const PUBLIC_PAGES = ["/doctor/signup"];
const AUTH_PAGES = ["/login", "/signup", "/doctor/signup"];

/**
 * Language in the address. Public pages: English at /x (served from the
 * app/(site)/[lang] route as /en/x), Bangla at /bn/x. Old addresses move
 * permanently: /x?lang=bn → /bn/x, /x?lang=en and /en/x → /x. Signed-in pages
 * keep one address; there `?lang=` still picks (and remembers) the language.
 */
type LocaleRoute =
  | { kind: "redirect"; response: NextResponse }
  | { kind: "site"; locale: Locale; rewrite: URL | null }
  | { kind: "app"; forced: Locale | null };

function localeRoute(request: NextRequest): LocaleRoute {
  const { pathname, searchParams } = request.nextUrl;
  const { locale: prefix, path } = splitLocale(pathname);
  const param = searchParams.get("lang");
  const asked = isLocale(param) ? param : null;
  if (!isSitePath(path)) return { kind: "app", forced: prefix ? null : asked };

  const readOnly = request.method === "GET" || request.method === "HEAD";
  if (readOnly && (prefix === "en" || searchParams.has("lang"))) {
    const url = request.nextUrl.clone();
    url.searchParams.delete("lang");
    url.pathname = localePath(path, asked ?? prefix ?? "en");
    return { kind: "redirect", response: NextResponse.redirect(url, 301) };
  }
  const locale: Locale = prefix === "bn" ? "bn" : "en";
  if (prefix) return { kind: "site", locale, rewrite: null };
  const url = request.nextUrl.clone();
  url.pathname = path === "/" ? "/en" : `/en${path}`;
  return { kind: "site", locale, rewrite: url };
}

/**
 * On the production deployment, visits to the *.vercel.app address are sent
 * to the real domain (NEXT_PUBLIC_SITE_URL), so search engines see one site.
 * Preview deployments keep working on their own addresses.
 */
function canonicalHostRedirect(request: NextRequest) {
  if (process.env.VERCEL_ENV !== "production" || !process.env.NEXT_PUBLIC_SITE_URL) return null;
  const host = request.headers.get("host") ?? "";
  const target = new URL(normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL));
  if (!host.endsWith(".vercel.app") || host === target.host) return null;
  const url = new URL(request.nextUrl.pathname + request.nextUrl.search, target);
  return NextResponse.redirect(url, 308);
}

export async function updateSession(request: NextRequest) {
  const moved = canonicalHostRedirect(request);
  if (moved) return moved;
  const route = localeRoute(request);
  if (route.kind === "redirect") return route.response;
  const lang = route.kind === "site" ? route.locale : route.forced;
  const next = () => {
    if (!lang) return NextResponse.next({ request });
    const headers = new Headers(request.headers);
    headers.set("x-ff-locale", lang);
    if (route.kind === "site" && route.rewrite) return NextResponse.rewrite(route.rewrite, { request: { headers } });
    return NextResponse.next({ request: { headers } });
  };
  let response = next();

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = next();
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Refreshes the auth token if needed. Do not run code between
  // createServerClient and getClaims().
  const { data } = await supabase.auth.getClaims();
  const isSignedIn = Boolean(data?.claims);
  const { pathname } = request.nextUrl;
  const page = splitLocale(pathname).path;

  if (!isSignedIn && !PUBLIC_PAGES.includes(pathname) && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone();
    // Signed-in parts of the site have no language in the address: send the
    // visitor to the login page in the language they last chose.
    const saved = request.cookies.get(LOCALE_COOKIE)?.value;
    url.pathname = localePath("/login", isLocale(saved) ? saved : "en");
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  if (isSignedIn && AUTH_PAGES.includes(page)) {
    // The token's signature can stay valid after the session was revoked (e.g.
    // an admin suspended the user), so confirm with the auth server before
    // bouncing to the dashboard. Otherwise a revoked session loops forever:
    // dashboard → login (revoked) → dashboard (token still "valid").
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  // The visitor's country for prices in taka or dollars on the (static) home page.
  const country = (request.headers.get("x-vercel-ip-country") ?? request.headers.get("cf-ipcountry"))?.toUpperCase();
  if (country && /^[A-Z]{2}$/.test(country) && country !== "XX" && request.cookies.get("ff-cc")?.value !== country) {
    response.cookies.set("ff-cc", country, { path: "/", maxAge: 60 * 60 * 24, sameSite: "lax" });
  }
  if (route.kind === "app" && lang) response.cookies.set(LOCALE_COOKIE, lang, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return response;
}
