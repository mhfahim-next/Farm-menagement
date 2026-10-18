import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_KEY, SUPABASE_URL } from "./env";

const PROTECTED_PREFIXES = ["/dashboard", "/onboarding", "/admin", "/suspended", "/doctor", "/invites"];
const PUBLIC_PAGES = ["/doctor/signup"];
const AUTH_PAGES = ["/login", "/signup", "/doctor/signup"];

/**
 * `?lang=bn` / `?lang=en` picks the language for this request (and remembers
 * it), so search engines can index both language versions of public pages.
 */
function forcedLocale(request: NextRequest) {
  const lang = request.nextUrl.searchParams.get("lang");
  return lang === "en" || lang === "bn" ? lang : null;
}

export async function updateSession(request: NextRequest) {
  const lang = forcedLocale(request);
  const next = () => {
    if (!lang) return NextResponse.next({ request });
    const headers = new Headers(request.headers);
    headers.set("x-ff-locale", lang);
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

  if (!isSignedIn && !PUBLIC_PAGES.includes(pathname) && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  if (isSignedIn && AUTH_PAGES.includes(pathname)) {
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

  if (lang) response.cookies.set("locale", lang, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return response;
}
