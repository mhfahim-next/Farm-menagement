// Shared (server + client) i18n helpers. No server-only imports here.
import type { EnMessages } from "./messages/en";

export const LOCALES = ["en", "bn"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "locale";

export type MessageKey = keyof EnMessages;
export type Messages = Record<MessageKey, string>;

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

const INTL_LOCALE: Record<Locale, string> = { en: "en-GB", bn: "bn-BD" };
const INTL_NUMBER_LOCALE: Record<Locale, string> = { en: "en-US", bn: "bn-BD" };

function interpolate(
  template: string,
  vars: Record<string, string | number> | undefined,
  formatNumber: (n: number) => string,
) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) => {
    if (!(name in vars)) return match;
    const value = vars[name];
    return typeof value === "number" ? formatNumber(value) : value;
  });
}

function prettify(value: string) {
  return value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

/** Builds the translate function, enum labeller and locale-aware formatters. */
export function createI18n(locale: Locale, messages: Messages) {
  const lookup = messages as Record<string, string>;
  const numberLocale = INTL_NUMBER_LOCALE[locale];
  const dateLocale = INTL_LOCALE[locale];
  const plainNumber = new Intl.NumberFormat(numberLocale, { useGrouping: false, maximumFractionDigits: 2 });

  /**
   * Translates a key. When `vars.n` is 1 and a `<key>_one` message exists,
   * that singular form is used (English only needs it; Bangla repeats the text).
   */
  function t(key: MessageKey, vars?: Record<string, string | number>) {
    const one = vars?.n === 1 ? lookup[`${key}_one`] : undefined;
    return interpolate(one ?? lookup[key] ?? key, vars, (n) => plainNumber.format(n));
  }

  /** Label for a stored enum value, e.g. "parasite_control" → "Pest control". */
  function e(value: string | null | undefined) {
    if (!value) return "—";
    return lookup[`enum.${value}`] ?? prettify(value);
  }

  /** Translation for a dynamic key (stored category, heat sign, audit action…), or undefined. */
  function maybe(key: string) {
    return lookup[key];
  }

  const f = {
    date(value: string | null | undefined) {
      if (!value) return "—";
      const [y, m, d] = value.slice(0, 10).split("-").map(Number);
      return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(dateLocale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      });
    },
    dateTime(value: string | null | undefined) {
      if (!value) return "—";
      return new Date(value).toLocaleString(dateLocale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    weekday(day: string) {
      return new Date(day + "T00:00:00Z").toLocaleDateString(dateLocale, {
        weekday: "short",
        timeZone: "UTC",
      });
    },
    number(value: number, digits = 0) {
      return new Intl.NumberFormat(numberLocale, { maximumFractionDigits: digits }).format(value);
    },
    money(amount: number, currency: string) {
      try {
        return new Intl.NumberFormat(numberLocale, {
          style: "currency",
          currency,
          maximumFractionDigits: 0,
        }).format(amount);
      } catch {
        return `${currency} ${this.number(amount)}`;
      }
    },
  };

  return { locale, t, e, f, maybe };
}

export type I18n = ReturnType<typeof createI18n>;
