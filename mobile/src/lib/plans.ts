// Plan prices and limits shown on the plan screen (pure, unit-tested).
import type { Plan } from "./farm";
import type { Locale } from "./i18n/core";

export const planName = (p: Pick<Plan, "name_en" | "name_bn">, locale: Locale) => (locale === "bn" ? p.name_bn || p.name_en : p.name_en);

/** Monthly price in the farm's currency (null = not sold in that currency). */
export function monthlyPrice(p: Pick<Plan, "price_monthly" | "price_monthly_usd">, currency: string) {
  if (currency === "USD") return p.price_monthly_usd === null ? null : Number(p.price_monthly_usd);
  return Number(p.price_monthly);
}

const LIMITS = [
  ["max_cattle", "plan.cattle", "plan.cattleAll"],
  ["max_goats", "plan.goats", "plan.goatsAll"],
  ["max_flocks", "plan.flocks", "plan.flocksAll"],
  ["max_members", "plan.members", "plan.membersAll"],
  ["max_farms", "plan.farms", "plan.farmsAll"],
] as const;

export type LimitLine = { key: (typeof LIMITS)[number][1] | (typeof LIMITS)[number][2]; n?: number };

/** The limits shown on a plan card, in a fixed order (null in the database = unlimited). */
export function limitLines(p: Plan): LimitLine[] {
  return LIMITS.map(([col, some, all]) => (p[col] === null ? { key: all } : { key: some, n: Number(p[col]) }));
}

/** The plan to highlight: the cheapest paid one. */
export function popularKey(plans: Plan[]) {
  return [...plans].filter((p) => Number(p.price_monthly) > 0).sort((a, b) => Number(a.price_monthly) - Number(b.price_monthly))[0]?.key ?? null;
}
