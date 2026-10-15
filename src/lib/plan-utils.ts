// Pure helpers for plans and limits (usable on server and client).
import type { I18n } from "./i18n/core";

export type Plan = {
  key: string;
  name_en: string;
  name_bn: string | null;
  price_monthly: number | null;
  max_cattle: number | null;
  max_flocks: number | null;
  max_members: number | null;
  max_farms: number | null;
  can_export: boolean;
  priority_support: boolean;
  active: boolean;
  sort_order: number;
};

export type UsageKey = "cattle" | "flocks" | "members";
export type Usage = Record<UsageKey, number>;
export type LimitState = "ok" | "warn" | "full" | "over";

export const USAGE_KEYS: UsageKey[] = ["cattle", "flocks", "members"];

export function planName(plan: Pick<Plan, "name_en" | "name_bn"> | undefined, locale: string, fallback = "") {
  if (!plan) return fallback;
  return (locale === "bn" ? plan.name_bn || plan.name_en : plan.name_en) || fallback;
}

export function limitOf(plan: Plan, key: UsageKey): number | null {
  return key === "cattle" ? plan.max_cattle : key === "flocks" ? plan.max_flocks : plan.max_members;
}

/** ok < 80% · warn ≥ 80% · full = at the limit · over = above it (plan was lowered). */
export function limitState(used: number, max: number | null): LimitState {
  if (max === null) return "ok";
  if (used > max) return "over";
  if (used >= max) return "full";
  return used >= Math.ceil(max * 0.8) ? "warn" : "ok";
}

/** Feature bullets for a plan card, built from its numbers and flags. */
export function planFeatures(t: I18n["t"], plan: Plan): string[] {
  const out: string[] = [];
  out.push(plan.max_cattle === null ? t("plans.feat.cattleUnlimited") : t("plans.feat.cattle", { n: plan.max_cattle }));
  out.push(plan.max_flocks === null ? t("plans.feat.flocksUnlimited") : t("plans.feat.flocks", { n: plan.max_flocks }));
  out.push(plan.max_members === null ? t("plans.feat.membersUnlimited") : t("plans.feat.members", { n: plan.max_members }));
  out.push(plan.max_farms === null ? t("plans.feat.farmsUnlimited") : t("plans.feat.farms", { n: plan.max_farms }));
  if (plan.can_export) out.push(t("plans.feat.export"));
  if (plan.priority_support) out.push(t("plans.feat.prioritySupport"));
  return out;
}

/** "৳999" / "৳1,999" (Bangla digits in Bangla) or "Custom". */
export function priceText({ t, f }: Pick<I18n, "t" | "f">, plan: Plan) {
  return plan.price_monthly === null ? t("plans.priceCustom") : t("plans.price", { n: f.number(plan.price_monthly) });
}

/**
 * How many farms a user may own. Mirrors create_farm() in the database:
 * unlimited if any owned farm is on a plan with max_farms = null.
 */
export function farmQuota(plans: Plan[], ownedFarmPlans: string[]) {
  const owned = ownedFarmPlans.length;
  if (owned === 0) return { allowed: true, cap: 1 as number | null };
  const byKey = new Map(plans.map((p) => [p.key, p]));
  const caps = ownedFarmPlans.map((k) => byKey.get(k)?.max_farms ?? 1);
  const unlimited = ownedFarmPlans.some((k) => byKey.get(k)?.max_farms === null);
  if (unlimited) return { allowed: true, cap: null };
  const cap = Math.max(...caps);
  return { allowed: owned < cap, cap };
}
