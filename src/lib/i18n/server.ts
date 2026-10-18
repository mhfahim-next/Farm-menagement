import "server-only";
import { cache } from "react";
import { getCachedOptionRows } from "@/lib/public-data";
import { createClient } from "@/lib/supabase/server";
import type { OptionRow } from "../options";
import { cookies, headers } from "next/headers";
import { createI18n, DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale, type Messages } from "./core";
import { bn } from "./messages/bn";
import { en } from "./messages/en";

const catalogs: Record<Locale, Messages> = { en, bn };

export function messagesFor(locale: Locale): Messages {
  return catalogs[locale];
}

/** Locale from the cookie; on a first visit, from the browser's Accept-Language. */
export const getLocale = cache(async (): Promise<Locale> => {
  // ?lang=bn|en in the URL (set by the proxy) wins, so each language has its own address.
  const forced = (await headers()).get("x-ff-locale");
  if (isLocale(forced)) return forced;
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;

  const accept = (await headers()).get("accept-language") ?? "";
  const first = accept.split(",")[0]?.trim().toLowerCase() ?? "";
  return first.startsWith("bn") ? "bn" : DEFAULT_LOCALE;
});

/** All admin-managed dropdown options (cached across requests, see lib/public-data). */
export const getOptionRows = cache(async (): Promise<OptionRow[]> => {
  try {
    return await getCachedOptionRows();
  } catch {
    // Cache miss that failed: fall back to a direct read.
  }
  const supabase = await createClient();
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
