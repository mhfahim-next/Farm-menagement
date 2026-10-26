// Paying for a plan: pure helpers shared by the server and the browser.
import type { I18n } from "./i18n/core";
import type { Plan } from "./plan-utils";

export type Currency = "BDT" | "USD";
export type MethodKind = "manual" | "stripe" | "sslcommerz";

export type PaymentMethod = {
  key: string;
  kind: MethodKind;
  name_en: string;
  name_bn: string | null;
  account_number: string | null;
  account_name: string | null;
  account_type: string | null;
  instructions_en: string | null;
  instructions_bn: string | null;
  currencies: Currency[];
  active: boolean;
  sort_order: number;
};

export type BillingPeriod = { months: number; discount_percent: number; active: boolean };

export type PaymentStatus = "awaiting" | "pending" | "paid" | "rejected" | "cancelled" | "failed";

export type Payment = {
  id: string;
  receipt_no: number;
  farm_id: string;
  created_by: string | null;
  plan: string;
  months: number;
  currency: Currency;
  amount: number;
  method: string;
  status: PaymentStatus;
  trx_id: string | null;
  provider_ref: string | null;
  provider_payment_id: string | null;
  admin_note: string | null;
  reviewed_at: string | null;
  paid_at: string | null;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
};

export const STATUS_TONE: Record<PaymentStatus, "amber" | "green" | "red" | "blue" | "default"> = {
  awaiting: "default",
  pending: "amber",
  paid: "green",
  rejected: "red",
  cancelled: "default",
  failed: "red",
};

/** Bangladesh (and local development, where there is no geo header) pays in taka; everyone else in dollars. */
export function currencyFor(country: string | null): Currency {
  return country === null || country === "BD" ? "BDT" : "USD";
}

/** "?cur=usd" lets someone switch by hand. */
export function pickCurrency(country: string | null, wanted: unknown): Currency {
  if (typeof wanted === "string" && ["bdt", "usd"].includes(wanted.toLowerCase())) return wanted.toUpperCase() as Currency;
  return currencyFor(country);
}

export function monthlyPrice(plan: Plan, currency: Currency): number | null {
  return currency === "USD" ? (plan.price_monthly_usd ?? null) : plan.price_monthly;
}

/** Same sum as plan_price() in the database (src: supabase/migrations/…_payments.sql). */
export function priceFor(plan: Plan, months: number, discountPercent: number, currency: Currency): number | null {
  const base = monthlyPrice(plan, currency);
  if (base === null) return null;
  const raw = (base * months * (100 - discountPercent)) / 100;
  return currency === "USD" ? Math.round(raw * 100) / 100 : Math.round(raw);
}

/** ৳999 / $9.50 — whole taka, cents only when there are some. */
export function moneyText(f: I18n["f"], amount: number, currency: Currency) {
  if (currency === "BDT") return `৳${f.number(amount)}`;
  return Number.isInteger(amount) ? f.money(amount, "USD") : f.moneyExact(amount, "USD");
}

export function methodName(m: Pick<PaymentMethod, "name_en" | "name_bn"> | undefined, locale: string, fallback = "") {
  if (!m) return fallback;
  return (locale === "bn" ? m.name_bn || m.name_en : m.name_en) || fallback;
}

export function methodInstructions(m: PaymentMethod, locale: string) {
  return (locale === "bn" ? m.instructions_bn || m.instructions_en : m.instructions_en || m.instructions_bn) ?? null;
}

/** Receipt number as printed: FF-000042. */
export function receiptCode(n: number) {
  return `FF-${String(n).padStart(6, "0")}`;
}

/**
 * Each wallet in its own colours, so people recognise it at a glance.
 * Unknown (custom) methods get a neutral look.
 */
export type MethodStyle = { bg: string; fg: string; soft: string; ring: string; word: string; wordBn?: string };

export const METHOD_STYLE: Record<string, MethodStyle> = {
  bkash: { bg: "#E2136E", fg: "#ffffff", soft: "#FDE7F1", ring: "#E2136E", word: "bKash", wordBn: "বিকাশ" },
  nagad: { bg: "linear-gradient(135deg,#F7941D 0%,#EC1C24 100%)", fg: "#ffffff", soft: "#FFF1E3", ring: "#EE4B23", word: "Nagad", wordBn: "নগদ" },
  rocket: { bg: "#8C3494", fg: "#ffffff", soft: "#F5E8F6", ring: "#8C3494", word: "Rocket", wordBn: "রকেট" },
  upay: { bg: "linear-gradient(135deg,#0054A6 0%,#0072CE 100%)", fg: "#FFD400", soft: "#E6EFF8", ring: "#0054A6", word: "upay", wordBn: "উপায়" },
  bank: { bg: "#334155", fg: "#ffffff", soft: "#F1F5F9", ring: "#334155", word: "BANK", wordBn: "ব্যাংক" },
  stripe: { bg: "#635BFF", fg: "#ffffff", soft: "#EFEEFF", ring: "#635BFF", word: "stripe" },
  sslcommerz: { bg: "linear-gradient(135deg,#0E4C92 0%,#1F7AE0 100%)", fg: "#ffffff", soft: "#E8F1FC", ring: "#1F7AE0", word: "SSLCOMMERZ" },
};

export const DEFAULT_STYLE: MethodStyle = { bg: "#047857", fg: "#ffffff", soft: "#ECFDF5", ring: "#047857", word: "PAY" };

export function styleOf(key: string) {
  return METHOD_STYLE[key] ?? DEFAULT_STYLE;
}

/** Days until a date (negative once it has passed). */
export function daysUntil(iso: string, now = Date.now()) {
  return Math.ceil((new Date(iso).getTime() - now) / 86_400_000);
}

/** A moment some days from now, as an ISO string (negative = in the past). */
export function isoInDays(days: number) {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}
