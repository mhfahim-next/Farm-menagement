// Translate and format (pure: no React, so it can be unit-tested).
import { bn } from "./bn";
import { en, type MessageKey } from "./en";

export type Locale = "en" | "bn";
export const isLocale = (v: unknown): v is Locale => v === "en" || v === "bn";

const catalogs: Record<Locale, Record<MessageKey, string>> = { en, bn };
const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

/** Digits in the reader's script (Hermes may lack Bangla number data, so do it by hand). */
export function localDigits(s: string, locale: Locale) {
  return locale === "bn" ? s.replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]) : s;
}

export function formatNumber(n: number, locale: Locale, digits = 0, minDigits = 0) {
  const s = new Intl.NumberFormat("en-US", { maximumFractionDigits: digits, minimumFractionDigits: minDigits }).format(n);
  return localDigits(s, locale);
}

export function formatMoney(n: number, currency: string, locale: Locale) {
  const cents = n % 1 ? 2 : 0;
  const amount = formatNumber(n, locale, cents, cents);
  if (currency === "BDT") return `৳${amount}`;
  if (currency === "USD") return `$${amount}`;
  return `${currency} ${amount}`;
}

export function translate(locale: Locale, key: MessageKey, vars?: Record<string, string | number>) {
  // "1 farm" rather than "1 farms": a `<key>_one` text is used when n is 1.
  const one = vars?.n === 1 ? (catalogs[locale] as Record<string, string>)[`${key}_one`] : undefined;
  const text = one ?? catalogs[locale][key] ?? en[key] ?? key;
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, name) => {
    if (!(name in vars)) return m;
    const v = vars[name];
    return typeof v === "number" ? formatNumber(v, locale) : v;
  });
}

const MONTHS: Record<Locale, string[]> = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  bn: ["জানু", "ফেব্রু", "মার্চ", "এপ্রি", "মে", "জুন", "জুলাই", "আগ", "সেপ্টে", "অক্টো", "নভে", "ডিসে"],
};

/** "27 Oct 2026" / "২৭ অক্টো ২০২৬" from YYYY-MM-DD (the year is left out when `short`). */
export function formatDate(iso: string | null | undefined, locale: Locale, short = false) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? "");
  if (!m) return "";
  const text = `${Number(m[3])} ${MONTHS[locale][Number(m[2]) - 1]}${short ? "" : ` ${m[1]}`}`;
  return localDigits(text, locale);
}
