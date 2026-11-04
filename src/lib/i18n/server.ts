import "server-only";
import { cache } from "react";
import { appRequest } from "@/lib/app-request";
import { getCachedOptionRows } from "@/lib/public-data";
import { createPublicClient } from "@/lib/supabase/public";
import type { OptionRow } from "../options";
import { cookies, headers } from "next/headers";
import { lang } from "next/root-params";
import { createI18n, DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale, type Messages } from "./core";
import { CLIENT_KEYS } from "./client-keys";
import { bn } from "./messages/bn";
import { en } from "./messages/en";

const catalogs: Record<Locale, Messages> = { en, bn };

const clientCatalogs: Partial<Record<Locale, Messages>> = {};

/**
 * The translations the browser needs: only the keys client code uses
 * (src/lib/i18n/client-keys.ts). Server components translate on the server, so
 * sending the whole catalog made every page ~150 KB heavier.
 */
export function clientMessagesFor(locale: Locale): Messages {
  if (!clientCatalogs[locale]) {
    const all = catalogs[locale] as Record<string, string>;
    clientCatalogs[locale] = Object.fromEntries(CLIENT_KEYS.filter((k) => k in all).map((k) => [k, all[k]])) as Messages;
  }
  return clientCatalogs[locale]!;
}

export function messagesFor(locale: Locale): Messages {
  return catalogs[locale];
}

/**
 * Public pages (app/(site)/[lang]): the language in the address (/bn/… or
 * no prefix for English), never a cookie. Server actions and route handlers
 * can't read the route's language, so the proxy also passes it in the
 * x-ff-locale header. Signed-in pages: the saved cookie; on a first visit, the
 * browser's Accept-Language.
 */
export const getLocale = cache(async (): Promise<Locale> => {
  const app = appRequest();
  if (app) return app.locale;
  const fromRoute = await routeLocale();
  if (fromRoute) return fromRoute;
  const forced = (await headers()).get("x-ff-locale");
  if (isLocale(forced)) return forced;
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;

  const accept = (await headers()).get("accept-language") ?? "";
  const first = accept.split(",")[0]?.trim().toLowerCase() ?? "";
  return first.startsWith("bn") ? "bn" : DEFAULT_LOCALE;
});

/**
 * The [lang] of a public page; null in the signed-in app, server actions and
 * route handlers. Inside the public pages an unknown value (an address like
 * /abc.df, which the proxy leaves alone because it looks like a file, reaches
 * the route with lang = "abc.df") is English: the page is a 404, and reading
 * the request headers here would turn that static page into a 500.
 */
async function routeLocale(): Promise<Locale | null> {
  try {
    const value = await lang();
    if (typeof value !== "string") return null;
    return isLocale(value) ? value : DEFAULT_LOCALE;
  } catch {
    return null;
  }
}

/** All admin-managed dropdown options (cached across requests, see lib/public-data). */
export const getOptionRows = cache(async (): Promise<OptionRow[]> => {
  try {
    return await getCachedOptionRows();
  } catch {
    // Cache miss that failed: fall back to a direct read.
  }
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("dropdown_options")
    .select("list_key, value, label_en, label_bn, sort_order, active, can_hide, meta")
    .order("sort_order");
  if (error) {
    console.error("Could not load dropdown options:", error.message);
    return [];
  }
  return (data ?? []) as OptionRow[];
});

/** `const { t, e, f, o, options, locale } = await getI18n()` in server components and actions. */
export const getI18n = cache(async () => {
  const [locale, optionRows] = await Promise.all([getLocale(), getOptionRows()]);
  return createI18n(locale, messagesFor(locale), optionRows);
});
