import "server-only";
import { cache } from "react";
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
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;

  const accept = (await headers()).get("accept-language") ?? "";
  const first = accept.split(",")[0]?.trim().toLowerCase() ?? "";
  return first.startsWith("bn") ? "bn" : DEFAULT_LOCALE;
});

/** `const { t, e, f, locale } = await getI18n()` in server components and actions. */
export const getI18n = cache(async () => {
  const locale = await getLocale();
  return createI18n(locale, messagesFor(locale));
});
