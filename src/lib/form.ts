import type { I18n } from "@/lib/i18n/core";

// Small helpers for reading FormData in server actions.

export function str(fd: FormData, key: string) {
  const v = fd.get(key);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}

export function num(fd: FormData, key: string) {
  const v = str(fd, key);
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function int(fd: FormData, key: string) {
  const n = num(fd, key);
  return n === null ? null : Math.trunc(n);
}

// Messages raised by our own database rules, mapped to translated text.
const RULE_MESSAGES: Record<string, Parameters<I18n["t"]>[0]> = {
  "Set the weight of one unit (kg) for this stock item first.": "stock.errUnitKg",
  "Unknown stock item.": "stock.errPickItem",
  "Unknown buyer.": "sales.errBuyer",
  "Unknown animal type.": "cattle.typeUnknown",
  "This animal type is no longer available.": "cattle.typeHidden",
  "This animal is recorded as a mother, so it must stay female.": "cattle.motherMustStayFemale",
  "The mother must be a female animal on this farm.": "cattle.motherNotFemale",
  "An animal cannot be its own mother.": "cattle.motherSelf",
};

const PLAN_LIMIT_KEYS = {
  cattle: "plan.limit.cattle",
  flocks: "plan.limit.flocks",
  members: "plan.limit.members",
  farms: "plan.limit.farms",
  ai: "plan.limit.ai",
} as const;

/** Turns Postgres errors into messages a farmer can act on. */
export function dbError(t: I18n["t"], error: { code?: string; message: string }) {
  const rule = RULE_MESSAGES[error.message];
  if (rule) return t(rule);
  // Raised by the plan-limit triggers: "PLAN_LIMIT:cattle:25"
  const limit = /^PLAN_LIMIT:(cattle|flocks|members|farms|ai):(\d+)/.exec(error.message);
  if (limit) return t(PLAN_LIMIT_KEYS[limit[1] as keyof typeof PLAN_LIMIT_KEYS], { n: Number(limit[2]) });
  if (error.code === "23505") return t("common.dbDuplicate");
  if (error.code === "23514") return t("common.dbRange");
  if (error.code === "42501") return t("common.dbForbidden");
  return error.message;
}
