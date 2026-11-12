// Daily feed suggestion per animal (cattle), from the farm's own feeding rule.
// Pure helpers: safe in client and server code, unit tested.
//
// Default rule and presets, from Bangladeshi teaching and extension sources:
// - Sher-e-Bangla Agricultural University, "Formulation of cattle ration by
//   thumb rule method" (lecture): roughage per 100 kg live weight 1 kg dry
//   (straw/hay) + 3 kg green; concentrate for milk: zebu 1.25 kg + 1 kg per
//   2.5 L, crossbred 2 kg + 1 kg per 2 L.
// - Blue Gold Program (Govt. of Bangladesh–Netherlands) farmer field school
//   messages: first 3 L of milk need 3 kg concentrate, then 0.5 kg more per
//   litre; at most 8 kg a day.
// - Khan et al. (2009), The Bangladesh Veterinarian 26(2): farmers are
//   advised 1 kg concentrate per 2–3 kg of milk.
// - NDDB (India) for a 400 kg cow: 1.5–2 kg for upkeep + 0.4 kg per litre,
//   which the default (0.5 kg per 100 kg + 1 kg per 2.5 L) matches.

export type FeedRule = {
  /** Concentrate for upkeep: kg per 100 kg body weight, plus a fixed kg. */
  maintPer100: number;
  maintFixed: number;
  /** Milk: the first `firstLitres` need `firstKg` (shared out when she gives less)… */
  firstLitres: number;
  firstKg: number;
  /** …then 1 kg for every `litresPerKg` litres more. */
  litresPerKg: number;
  /** Most concentrate in a day. */
  maxKg: number;
  /** Extra for a cow in the last two months before calving. */
  dryExtraKg: number;
  /** Heifers and breeding bulls: kg per 100 kg body weight. */
  youngPer100: number;
  /** Fattening animals: kg per 100 kg body weight. */
  fatPer100: number;
  /** Roughage per 100 kg body weight. */
  strawPer100: number;
  greenPer100: number;
  /** Share of the green grass the farm can give (1 = all, 0.5 = some, 0 = none); straw makes up the rest. */
  greenShare: number;
  /** Water: litres per 100 kg body weight plus litres per litre of milk. */
  waterPer100: number;
  waterPerLitre: number;
};

type Spec = { def: number; min: number; max: number; step: number };
export const FEED_SPEC: Record<keyof FeedRule, Spec> = {
  maintPer100: { def: 0.5, min: 0, max: 3, step: 0.05 },
  maintFixed: { def: 0, min: 0, max: 5, step: 0.05 },
  firstLitres: { def: 0, min: 0, max: 10, step: 0.5 },
  firstKg: { def: 0, min: 0, max: 6, step: 0.1 },
  litresPerKg: { def: 2.5, min: 1, max: 6, step: 0.1 },
  maxKg: { def: 10, min: 2, max: 20, step: 0.5 },
  dryExtraKg: { def: 1, min: 0, max: 4, step: 0.1 },
  youngPer100: { def: 0.5, min: 0, max: 3, step: 0.05 },
  fatPer100: { def: 1, min: 0, max: 3, step: 0.05 },
  strawPer100: { def: 1, min: 0, max: 4, step: 0.1 },
  greenPer100: { def: 3, min: 0, max: 10, step: 0.5 },
  greenShare: { def: 1, min: 0, max: 1, step: 0.5 },
  waterPer100: { def: 10, min: 4, max: 20, step: 0.5 },
  waterPerLitre: { def: 4, min: 2, max: 6, step: 0.5 },
};
export const FEED_KEYS = Object.keys(FEED_SPEC) as (keyof FeedRule)[];
export const FEED_DEFAULTS = Object.fromEntries(FEED_KEYS.map((k) => [k, FEED_SPEC[k].def])) as FeedRule;

/** Ready-made rules the farmer can start from (the milk part only; the rest stays). */
export const FEED_PRESETS = {
  standard: { maintPer100: 0.5, maintFixed: 0, firstLitres: 0, firstKg: 0, litresPerKg: 2.5, maxKg: 10 },
  deshi: { maintPer100: 0, maintFixed: 1.25, firstLitres: 0, firstKg: 0, litresPerKg: 2.5, maxKg: 8 },
  cross: { maintPer100: 0, maintFixed: 2, firstLitres: 0, firstKg: 0, litresPerKg: 2, maxKg: 12 },
  bluegold: { maintPer100: 0, maintFixed: 0, firstLitres: 3, firstKg: 3, litresPerKg: 2, maxKg: 8 },
} satisfies Record<string, Partial<FeedRule>>;
export type FeedPreset = keyof typeof FEED_PRESETS;

/** The farm's saved rule over the defaults; unknown keys and bad numbers are dropped. */
export function feedRule(saved: unknown): FeedRule {
  const out = { ...FEED_DEFAULTS };
  if (saved && typeof saved === "object") {
    for (const k of FEED_KEYS) {
      const v = Number((saved as Record<string, unknown>)[k]);
      const s = FEED_SPEC[k];
      if ((saved as Record<string, unknown>)[k] !== undefined && (saved as Record<string, unknown>)[k] !== "" && Number.isFinite(v) && v >= s.min && v <= s.max) out[k] = v;
    }
  }
  return out;
}

/** Which preset a rule's milk part matches, or null for the farm's own rule. */
export function presetOf(rule: FeedRule): FeedPreset | null {
  for (const [name, p] of Object.entries(FEED_PRESETS) as [FeedPreset, Partial<FeedRule>][]) {
    if (Object.entries(p).every(([k, v]) => rule[k as keyof FeedRule] === v)) return name;
  }
  return null;
}

export type FeedAnimal = {
  category: string | null;
  /** Body weight, kg; null = not weighed (an estimate by kind is used). */
  weightKg: number | null;
  /** Average milk a day lately, litres. */
  milkL: number;
  isFattening?: boolean;
  /** Days until she is due to calve (when known). */
  daysToCalving?: number | null;
};

export type FeedKind = "milking" | "dry" | "young" | "bull" | "fattening";

/** Weights used when an animal has never been weighed (Bangladeshi local and crossbred average). */
export const GUESS_WEIGHT: Record<string, number> = { cow: 350, heifer: 220, bull: 400 };

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Concentrate for the milk alone (kg). */
export function milkConcentrate(milkL: number, rule: FeedRule) {
  if (!(milkL > 0)) return 0;
  let kg = 0;
  let rest = milkL;
  if (rule.firstLitres > 0) {
    const first = Math.min(milkL, rule.firstLitres);
    kg += (rule.firstKg * first) / rule.firstLitres;
    rest = milkL - first;
  }
  return kg + rest / rule.litresPerKg;
}

export type FeedPlan = {
  kind: FeedKind;
  weightKg: number;
  weightGuessed: boolean;
  milkL: number;
  concentrateKg: number;
  /** The rule's total was more than the farm's daily limit. */
  capped: boolean;
  strawKg: number;
  greenKg: number;
  waterL: number;
  /** In the last two months before calving (extra concentrate added). */
  closeUp: boolean;
};

export function feedPlan(a: FeedAnimal, rule: FeedRule = FEED_DEFAULTS): FeedPlan {
  const category = a.category ?? "cow";
  const weightGuessed = !(a.weightKg && a.weightKg > 0);
  const w = weightGuessed ? (GUESS_WEIGHT[category] ?? 300) : (a.weightKg as number);
  const milk = Math.max(0, a.milkL || 0);
  const kind: FeedKind = a.isFattening ? "fattening" : category === "cow" ? (milk > 0 ? "milking" : "dry") : category === "bull" ? "bull" : "young";
  const closeUp = category === "cow" && a.daysToCalving != null && a.daysToCalving >= 0 && a.daysToCalving <= 60;

  let conc: number;
  if (kind === "fattening") conc = (rule.fatPer100 * w) / 100;
  else if (kind === "milking" || kind === "dry") conc = (rule.maintPer100 * w) / 100 + rule.maintFixed + milkConcentrate(milk, rule) + (closeUp ? rule.dryExtraKg : 0);
  else conc = (rule.youngPer100 * w) / 100;
  const capped = conc > rule.maxKg;
  if (capped) conc = rule.maxKg;

  // Green grass the farm cannot give is made up with straw (about 3 kg green = 1 kg straw).
  const greenFull = (rule.greenPer100 * w) / 100;
  const green = greenFull * rule.greenShare;
  const straw = (rule.strawPer100 * w) / 100 + (greenFull - green) / 3;

  return {
    kind,
    weightKg: Math.round(w),
    weightGuessed,
    milkL: r1(milk),
    concentrateKg: r1(conc),
    capped,
    strawKg: r1(straw),
    greenKg: r1(green),
    waterL: Math.round((rule.waterPer100 * w) / 100 + rule.waterPerLitre * milk),
    closeUp,
  };
}

/** Adds up a list of plans (the farm's daily need). */
export function feedTotals(plans: FeedPlan[]) {
  const sum = (f: (p: FeedPlan) => number) => plans.reduce((s, p) => s + f(p), 0);
  return {
    concentrateKg: r1(sum((p) => p.concentrateKg)),
    strawKg: r1(sum((p) => p.strawKg)),
    greenKg: r1(sum((p) => p.greenKg)),
    waterL: Math.round(sum((p) => p.waterL)),
  };
}
