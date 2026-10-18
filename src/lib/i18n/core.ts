// Shared (server + client) i18n helpers. No server-only imports here.
import type { ListKey, OptionRow } from "../options";
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

/**
 * Builds the translate function, enum labeller, admin-managed dropdown
 * options and locale-aware formatters.
 */
export function createI18n(locale: Locale, messages: Messages, optionRows: OptionRow[] = []) {
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

  const byList = new Map<ListKey, OptionRow[]>();
  for (const row of [...optionRows].sort((a, b) => a.sort_order - b.sort_order)) {
    byList.set(row.list_key, [...(byList.get(row.list_key) ?? []), row]);
  }
  const rowLabel = (row: OptionRow) =>
    (locale === "bn" ? row.label_bn || row.label_en : row.label_en || row.label_bn) ?? row.value;

  /** Label of a stored value from an admin-managed list (hidden options too). */
  function o(list: ListKey, value: string | null | undefined) {
    if (!value) return "—";
    const row = byList.get(list)?.find((r) => r.value === value);
    if (row) return rowLabel(row);
    return lookup[`enum.${value}`] ?? lookup[`cat.${value}`] ?? prettify(value);
  }

  /** Every option of a list, hidden ones included (for logic and admin). */
  function rows(list: ListKey) {
    return byList.get(list) ?? [];
  }

  /**
   * Visible options of a list for a <select>. Pass `keep` with the record's
   * current value so a since-hidden option still shows when editing it.
   */
  function options(list: ListKey, keep?: string | null) {
    const visible = rows(list).filter((r) => r.active || r.value === keep);
    const result = visible.map((r) => ({ value: r.value, label: rowLabel(r), meta: r.meta }));
    if (keep && !result.some((r) => r.value === keep)) {
      result.unshift({ value: keep, label: o(list, keep), meta: {} });
    }
    return result;
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
    /** "HH:MM[:SS]" time of day, shown with the language's digits. */
    time(value: string | null | undefined) {
      if (!value) return "";
      const [h, m] = value.split(":").map(Number);
      if (!Number.isFinite(h) || !Number.isFinite(m)) return "";
      return new Date(Date.UTC(1970, 0, 1, h, m)).toLocaleTimeString(dateLocale, {
        hour: "numeric",
        minute: "2-digit",
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
    /** "YYYY-MM[-DD]" as a month name and year, e.g. "Oct 2026". */
    month(value: string) {
      const [y, m] = value.slice(0, 7).split("-").map(Number);
      return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(dateLocale, { month: "short", year: "numeric", timeZone: "UTC" });
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
    /** Money with paisa/cents, for per-litre and per-egg prices. */
    moneyExact(amount: number, currency: string) {
      try {
        return new Intl.NumberFormat(numberLocale, {
          style: "currency",
          currency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(amount);
      } catch {
        return `${currency} ${this.number(amount, 2)}`;
      }
    },
  };

  return { locale, t, e, f, maybe, o, rows, options };
}

export type I18n = ReturnType<typeof createI18n>;
