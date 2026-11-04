// Copied from the website (src/lib/tools.ts) so both give the same numbers; change both together.
// Farm calculators (the Tools menu on the website and in the app). Pure
// functions with no imports, so the app keeps an exact copy. All results are
// estimates from commonly used rules of thumb; the pages say so.
//
// The numbers behind the rules (formula constants, ration shares, feed tables,
// gestation days, local unit sizes…) have defaults here. A super admin can
// change any of them; only the changed values are stored (table tool_settings)
// and mergeToolParams() lays them over the defaults.

const r1 = (n: number) => Math.round(n * 10) / 10;
const r2 = (n: number) => Math.round(n * 100) / 100;
const ok = (...ns: number[]) => ns.every((n) => Number.isFinite(n) && n > 0);

// ---------------------------------------------------------------- adjustable numbers

/** One adjustable number (or list of numbers, e.g. a feed table by week) with its default and allowed range. */
export type ParamSpec = { def: number | readonly number[]; min: number; max: number; maxLen?: number };

export const MIX_INGREDIENTS = ["wheat_bran", "maize", "oil_cake", "pulse_husk", "salt", "minerals"] as const;
export type Ingredient = (typeof MIX_INGREDIENTS)[number];
/** Feeds the least-cost ration can choose from (FEEDS below has what is in each). */
export const RATION_FEEDS = [
  "rice_straw",
  "napier",
  "local_grass",
  "maize_silage",
  "legume_fodder",
  "wheat_bran",
  "rice_polish",
  "maize",
  "broken_rice",
  "mustard_cake",
  "soybean_meal",
  "pulse_husk",
  "molasses",
  "ready_feed",
] as const;
export type FeedId = (typeof RATION_FEEDS)[number];
export type Species = "cattle" | "buffalo" | "goat" | "sheep";
export const PREG_SPECIES = ["cattle", "buffalo", "goat", "sheep"] as const;
/** Units whose size is a local custom (and can be adjusted); the rest are exact. */
export const LOCAL_UNITS = ["maund", "seer", "hand", "decimal", "katha", "bigha"] as const;

const pct = (def: number) => ({ def, min: 0, max: 100 });
const mixSpec = (m: Record<Ingredient, number>) =>
  Object.fromEntries(MIX_INGREDIENTS.map((i) => [i, pct(m[i])])) as Record<Ingredient, { def: number; min: number; max: number }>;
const pregSpec = (gestation: number, check: number, cycle: number, dry: number) => ({
  gestation: { def: gestation, min: 100, max: 400 },
  check: { def: check, min: 20, max: 120 },
  cycle: { def: cycle, min: 10, max: 40 },
  dry: { def: dry, min: 0, max: 120 },
});

export const TOOL_PARAM_SPEC = {
  weight: {
    divisor: { def: 10838, min: 5000, max: 20000 },
    spreadPct: { def: 10, min: 0, max: 30 },
  },
  ration: {
    dairyDmPct: { def: 3, min: 1, max: 6 },
    dairyGreenPct: { def: 8, min: 0, max: 20 },
    litresPerKg: { def: 2.5, min: 1, max: 6 },
    litresPerKgRich: { def: 2, min: 1, max: 6 },
    richFatPct: { def: 4.5, min: 3, max: 9 },
    upkeepSmall: { def: 1, min: 0, max: 5 },
    upkeepMid: { def: 1.5, min: 0, max: 5 },
    upkeepLarge: { def: 2, min: 0, max: 6 },
    fatDmPct: { def: 2.8, min: 1, max: 6 },
    fatGreenPct: { def: 6, min: 0, max: 20 },
    fatConcPct: { def: 1, min: 0, max: 3 },
    concPerKgGain: { def: 1.5, min: 0, max: 5 },
  },
  mixDairy: mixSpec({ wheat_bran: 40, maize: 25, oil_cake: 20, pulse_husk: 12, salt: 1, minerals: 2 }),
  /** Starting price of each feed, taka per kg as bought (the farmer can type their own). */
  feedPrice: {
    rice_straw: { def: 8, min: 0, max: 1000 },
    napier: { def: 4, min: 0, max: 1000 },
    local_grass: { def: 3, min: 0, max: 1000 },
    maize_silage: { def: 9, min: 0, max: 1000 },
    legume_fodder: { def: 5, min: 0, max: 1000 },
    wheat_bran: { def: 52, min: 0, max: 1000 },
    rice_polish: { def: 32, min: 0, max: 1000 },
    maize: { def: 38, min: 0, max: 1000 },
    broken_rice: { def: 40, min: 0, max: 1000 },
    mustard_cake: { def: 62, min: 0, max: 1000 },
    soybean_meal: { def: 75, min: 0, max: 1000 },
    pulse_husk: { def: 42, min: 0, max: 1000 },
    molasses: { def: 35, min: 0, max: 1000 },
    ready_feed: { def: 55, min: 0, max: 1000 },
  },
  mixFattening: mixSpec({ maize: 30, wheat_bran: 30, oil_cake: 20, pulse_husk: 17, salt: 1, minerals: 2 }),
  poultry: {
    layer: { def: [10, 18, 25, 31, 38, 43, 48, 53, 58, 58, 63, 63, 68, 68, 73, 73, 80, 90, 112], min: 1, max: 300, maxLen: 30 },
    broiler: { def: [22, 55, 95, 135, 170, 195], min: 1, max: 300, maxLen: 30 },
    sonali: { def: [10, 18, 26, 34, 42, 50, 56, 62, 68], min: 1, max: 300, maxLen: 30 },
    water: { def: 2, min: 1, max: 5 },
    waterHot: { def: 2.5, min: 1, max: 6 },
    bagKg: { def: 50, min: 1, max: 100 },
  },
  pregCattle: pregSpec(283, 60, 21, 60),
  pregBuffalo: pregSpec(310, 60, 21, 60),
  pregGoat: pregSpec(150, 45, 21, 45),
  pregSheep: pregSpec(147, 45, 17, 45),
  meat: {
    cattleLow: { def: 50, min: 20, max: 80 },
    cattleHigh: { def: 55, min: 20, max: 80 },
    goatLow: { def: 45, min: 20, max: 80 },
    goatHigh: { def: 50, min: 20, max: 80 },
  },
  units: {
    maund: { def: 40, min: 1, max: 100 },
    seer: { def: 0.9331, min: 0.1, max: 2 },
    hand: { def: 45.72, min: 20, max: 80 },
    decimal: { def: 40.4686, min: 10, max: 100 },
    katha: { def: 66.89, min: 20, max: 1000 },
    bigha: { def: 1337.8, min: 100, max: 15000 },
  },
  dose: {
    tabletStep: { def: 0.25, min: 0.05, max: 1 },
  },
  fodder: {
    kgPerDay: { def: 25, min: 1, max: 100 },
    tonnesPerAcre: { def: 70, min: 1, max: 300 },
    silageKgPerM3: { def: 600, min: 200, max: 1200 },
  },
  milk: {
    snf: { def: 8.5, min: 5, max: 12 },
    fatRate: { def: 600, min: 0, max: 100000 },
    snfRate: { def: 400, min: 0, max: 100000 },
    kgPerLitre: { def: 1.03, min: 1, max: 1.1 },
  },
} as const satisfies Record<string, Record<string, ParamSpec>>;

export type ToolParamGroup = keyof typeof TOOL_PARAM_SPEC;
export const TOOL_PARAM_GROUPS = Object.keys(TOOL_PARAM_SPEC) as ToolParamGroup[];
type ValueOf<S> = S extends { def: readonly number[] } ? number[] : number;
export type ToolParams = { [G in ToolParamGroup]: { [K in keyof (typeof TOOL_PARAM_SPEC)[G]]: ValueOf<(typeof TOOL_PARAM_SPEC)[G][K]> } };

const specOf = (g: ToolParamGroup) => TOOL_PARAM_SPEC[g] as Record<string, ParamSpec>;

function defaults(): ToolParams {
  const out: Record<string, Record<string, number | number[]>> = {};
  for (const g of TOOL_PARAM_GROUPS) {
    out[g] = Object.fromEntries(Object.entries(specOf(g)).map(([k, s]) => [k, typeof s.def === "number" ? s.def : [...s.def]]));
  }
  return out as ToolParams;
}
export const TOOL_DEFAULTS: ToolParams = defaults();

/** A stored value if it fits the spec (right kind, inside the range), else null. */
export function checkParam(spec: ParamSpec, v: unknown): number | number[] | null {
  const inRange = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && n >= spec.min && n <= spec.max;
  if (Array.isArray(spec.def)) {
    return Array.isArray(v) && v.length >= 1 && v.length <= (spec.maxLen ?? 30) && v.every(inRange) ? [...v] : null;
  }
  return inRange(v) ? v : null;
}

const same = (a: number | readonly number[], b: number | readonly number[]) =>
  Array.isArray(a) && Array.isArray(b) ? a.length === b.length && a.every((n, i) => n === b[i]) : a === b;

/** Rules a whole group must keep (a mix adds up to 100 %, the low share is not above the high one). */
export function groupProblem(group: ToolParamGroup, values: Record<string, number | number[]>): "mixTotal" | "lowHigh" | null {
  if (group === "mixDairy" || group === "mixFattening") {
    const total = MIX_INGREDIENTS.reduce((s, i) => s + (values[i] as number), 0);
    return Math.abs(total - 100) > 0.5 ? "mixTotal" : null;
  }
  if (group === "meat") {
    return (values.cattleLow as number) > (values.cattleHigh as number) || (values.goatLow as number) > (values.goatHigh as number) ? "lowHigh" : null;
  }
  return null;
}

/**
 * The numbers to calculate with: defaults, with the admin's stored changes laid
 * over them. Anything stored that no longer fits (unknown key, out of range, a
 * mix that doesn't add up) is ignored, so a bad row can never break a tool.
 * Also says which values are changed, per group.
 */
export function mergeToolParams(rows: readonly { tool: string; params: unknown }[] | null | undefined) {
  const params = defaults() as Record<string, Record<string, number | number[]>>;
  const custom: Partial<Record<ToolParamGroup, string[]>> = {};
  for (const row of rows ?? []) {
    if (!(row.tool in TOOL_PARAM_SPEC) || !row.params || typeof row.params !== "object") continue;
    const g = row.tool as ToolParamGroup;
    const next = { ...params[g] };
    const changed: string[] = [];
    for (const [k, spec] of Object.entries(specOf(g))) {
      const v = checkParam(spec, (row.params as Record<string, unknown>)[k]);
      if (v !== null && !same(v, spec.def)) {
        next[k] = v;
        changed.push(k);
      }
    }
    if (changed.length && !groupProblem(g, next)) {
      params[g] = next;
      custom[g] = changed;
    }
  }
  return { params: params as ToolParams, custom };
}

/** The unit tables with the local units' sizes from the params. */
export function unitGroups(p: ToolParams["units"] = TOOL_DEFAULTS.units) {
  return {
    weight: { kg: 1, g: 0.001, maund: p.maund, seer: p.seer },
    count: { piece: 1, hali: 4, dozen: 12, tray: 30 },
    length: { cm: 1, inch: 2.54, foot: 30.48, metre: 100, hand: p.hand },
    land: { decimal: p.decimal, katha: p.katha, bigha: p.bigha, acre: 4046.86, sqft: 0.092903 },
  };
}

// ---------------------------------------------------------------- 1. weight from a tape

export type LengthUnit = "cm" | "in";

/**
 * Live weight (kg) from heart girth and body length (Schaeffer's formula,
 * metric: girth² × length ÷ 10,838 by default). Used for cattle, goats and sheep
 * alike; expect roughly ±10 %.
 */
export function tapeWeightKg(girth: number, length: number, unit: LengthUnit = "cm", p: ToolParams["weight"] = TOOL_DEFAULTS.weight) {
  if (!ok(girth, length)) return null;
  const k = unit === "in" ? 2.54 : 1;
  const kg = ((girth * k) ** 2 * (length * k)) / p.divisor;
  const spread = p.spreadPct / 100;
  return { kg: r1(kg), low: r1(kg * (1 - spread)), high: r1(kg * (1 + spread)) };
}

// ---------------------------------------------------------------- 2. rations

export type Ration = {
  /** Dry matter the animal eats in a day, kg. */
  dryMatterKg: number;
  concentrateKg: number;
  greenGrassKg: number;
  strawKg: number;
  waterL: number;
  saltG: number;
  mineralG: number;
};

/** A milking cow: concentrate for her body plus 1 kg per 2.5 L of milk (per 2 L when fat is 4.5 % or more). */
export function dairyRation(weightKg: number, milkL: number, fatPct = 4, p: ToolParams["ration"] = TOOL_DEFAULTS.ration): Ration | null {
  if (!ok(weightKg) || !(milkL >= 0)) return null;
  const upkeep = weightKg <= 200 ? p.upkeepSmall : weightKg <= 350 ? p.upkeepMid : p.upkeepLarge;
  const concentrate = upkeep + milkL / (fatPct >= p.richFatPct ? p.litresPerKgRich : p.litresPerKg);
  const dm = (weightKg * p.dairyDmPct) / 100;
  const green = (weightKg * p.dairyGreenPct) / 100;
  const straw = Math.max(1, (dm - concentrate * 0.9 - green * 0.2) / 0.9);
  return {
    dryMatterKg: r1(dm),
    concentrateKg: r1(concentrate),
    greenGrassKg: r1(green),
    strawKg: r1(straw),
    waterL: Math.round(weightKg * 0.1 + milkL * 4),
    saltG: Math.round(30 + milkL * 2),
    mineralG: milkL > 0 ? 50 : 30,
  };
}

/** A fattening animal: concentrate about 1 % of body weight plus 1.5 kg per kg of daily gain wanted. */
export function fatteningRation(weightKg: number, gainKgPerDay: number, p: ToolParams["ration"] = TOOL_DEFAULTS.ration): Ration | null {
  if (!ok(weightKg) || !(gainKgPerDay >= 0)) return null;
  const concentrate = (weightKg * p.fatConcPct) / 100 + gainKgPerDay * p.concPerKgGain;
  const dm = (weightKg * p.fatDmPct) / 100;
  const green = (weightKg * p.fatGreenPct) / 100;
  const straw = Math.max(1, (dm - concentrate * 0.9 - green * 0.2) / 0.9);
  return {
    dryMatterKg: r1(dm),
    concentrateKg: r1(concentrate),
    greenGrassKg: r1(green),
    strawKg: r1(straw),
    waterL: Math.round(weightKg * 0.1),
    saltG: 30,
    mineralG: 40,
  };
}

/** Home-made concentrate mixes (% by weight). */
export const MIXES: Record<"dairy" | "fattening", Record<Ingredient, number>> = {
  dairy: TOOL_DEFAULTS.mixDairy,
  fattening: TOOL_DEFAULTS.mixFattening,
};

/** kg of each ingredient for `totalKg` of mix, and its cost per kg when every price is known. */
export function mixFor(
  kind: "dairy" | "fattening",
  totalKg: number,
  prices: Partial<Record<Ingredient, number>> = {},
  p: Pick<ToolParams, "mixDairy" | "mixFattening"> = TOOL_DEFAULTS,
) {
  const mix: Record<Ingredient, number> = kind === "dairy" ? p.mixDairy : p.mixFattening;
  const rows = MIX_INGREDIENTS.map((i) => ({ ingredient: i, pct: mix[i], kg: r2((totalKg * mix[i]) / 100), price: prices[i] ?? null }));
  const priced = rows.every((r) => r.price !== null && Number.isFinite(r.price) && r.price >= 0);
  const costPerKg = priced ? r2(rows.reduce((s, r) => s + (r.pct * (r.price as number)) / 100, 0)) : null;
  return { rows, costPerKg, cost: costPerKg !== null ? r2(costPerKg * totalKg) : null };
}

// ---------------------------------------------------------------- 3. poultry feed and water

export type BirdKind = "layer" | "broiler" | "sonali";

/** Typical feed per bird per day (g), by week of age (last value from then on): params.poultry.layer/broiler/sonali. */
export function poultryFeed(
  kind: BirdKind,
  birds: number,
  ageDays: number,
  opts: { bagPrice?: number; bagKg?: number; hot?: boolean } = {},
  p: ToolParams["poultry"] = TOOL_DEFAULTS.poultry,
) {
  if (!ok(birds) || !(ageDays >= 0)) return null;
  const table = p[kind];
  const week = Math.min(table.length, Math.floor(ageDays / 7) + 1);
  const g = table[week - 1];
  const kgDay = (g * birds) / 1000;
  const bagKg = opts.bagKg && opts.bagKg > 0 ? opts.bagKg : p.bagKg;
  const bagsMonth = (kgDay * 30) / bagKg;
  const costDay = opts.bagPrice && opts.bagPrice > 0 ? (kgDay / bagKg) * opts.bagPrice : null;
  return {
    week,
    gPerBird: g,
    kgPerDay: r1(kgDay),
    // Birds drink about twice what they eat; more in hot weather.
    waterLPerDay: r1(kgDay * (opts.hot ? p.waterHot : p.water)),
    bagsPerMonth: r1(bagsMonth),
    costPerDay: costDay !== null ? Math.round(costDay) : null,
    costPerMonth: costDay !== null ? Math.round(costDay * 30) : null,
  };
}

// ---------------------------------------------------------------- 4. pregnancy dates

export const pregGroup = (species: Species) =>
  (({ cattle: "pregCattle", buffalo: "pregBuffalo", goat: "pregGoat", sheep: "pregSheep" }) as const)[species];

const addDays = (iso: string, n: number) => new Date(Date.parse(iso + "T00:00:00Z") + n * 86_400_000).toISOString().slice(0, 10);
const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v + "T00:00:00Z"));

/** From the date of insemination or mating: when to check, the next heat if she didn't hold, drying off and the birth. */
export function pregnancyDates(species: Species, bredOn: string, today: string, gestationDays?: number, params: Pick<ToolParams, "pregCattle" | "pregBuffalo" | "pregGoat" | "pregSheep"> = TOOL_DEFAULTS) {
  if (!isDate(bredOn)) return null;
  const p = params[pregGroup(species)];
  const gestation = gestationDays && gestationDays > 0 ? gestationDays : p.gestation;
  const due = addDays(bredOn, gestation);
  const daysLeft = Math.round((Date.parse(due) - Date.parse(today)) / 86_400_000);
  return {
    gestation,
    nextHeat: addDays(bredOn, p.cycle),
    check: addDays(bredOn, p.check),
    dryOff: addDays(due, -p.dry),
    due,
    daysLeft,
  };
}

// ---------------------------------------------------------------- 5. Qurbani / selling an animal

/** Carcass (meat and bone) as a share of live weight: cattle 50–55 %, goats and sheep 45–50 %. */
export function meatValue(species: "cattle" | "goat", liveKg: number, price?: number, cost?: number, p: ToolParams["meat"] = TOOL_DEFAULTS.meat) {
  if (!ok(liveKg)) return null;
  const [lo, hi] = species === "cattle" ? [p.cattleLow / 100, p.cattleHigh / 100] : [p.goatLow / 100, p.goatHigh / 100];
  const carcassLow = r1(liveKg * lo);
  const carcassHigh = r1(liveKg * hi);
  const mid = (carcassLow + carcassHigh) / 2;
  const hasPrice = price !== undefined && price > 0;
  return {
    carcassLow,
    carcassHigh,
    pricePerLiveKg: hasPrice ? Math.round(price / liveKg) : null,
    pricePerMeatKg: hasPrice ? Math.round(price / mid) : null,
    profit: hasPrice && cost !== undefined && cost >= 0 ? Math.round(price - cost) : null,
  };
}

// ---------------------------------------------------------------- 6. units

export const UNIT_GROUPS = unitGroups();
export type UnitGroup = keyof typeof UNIT_GROUPS;

export function convertUnit<G extends UnitGroup>(
  group: G,
  value: number,
  from: keyof (typeof UNIT_GROUPS)[G],
  to: keyof (typeof UNIT_GROUPS)[G],
  p: ToolParams["units"] = TOOL_DEFAULTS.units,
) {
  if (!Number.isFinite(value)) return null;
  const units = unitGroups(p)[group] as Record<string, number>;
  const v = (value * units[from as string]) / units[to as string];
  return Math.round(v * 1000) / 1000;
}

// ---------------------------------------------------------------- 7. medicine dose

/** Dose for an animal's weight from the label's mg per kg, as ml of liquid or number of tablets (to the nearest tablet step, a quarter by default). */
export function doseFor(weightKg: number, mgPerKg: number, strength: { mgPerMl?: number; mgPerTablet?: number }, p: ToolParams["dose"] = TOOL_DEFAULTS.dose) {
  if (!ok(weightKg, mgPerKg)) return null;
  const mg = weightKg * mgPerKg;
  return {
    mg: r1(mg),
    ml: strength.mgPerMl && strength.mgPerMl > 0 ? r1(mg / strength.mgPerMl) : null,
    tablets: strength.mgPerTablet && strength.mgPerTablet > 0 ? r2(Math.round(mg / strength.mgPerTablet / p.tabletStep) * p.tabletStep) : null,
  };
}

// ---------------------------------------------------------------- 8. fodder land and silage

/**
 * Green grass for the herd for a year, and the land it needs at a given yield
 * (Napier gives about 60–80 t per acre a year). Silage for a lean period:
 * how many kg and roughly how much space (about 600 kg per cubic metre).
 */
export function fodderPlan(animals: number, kgPerAnimalDay: number, tonnesPerAcreYear: number, silageDays = 0, p: ToolParams["fodder"] = TOOL_DEFAULTS.fodder) {
  if (!ok(animals, kgPerAnimalDay, tonnesPerAcreYear)) return null;
  const kgYear = animals * kgPerAnimalDay * 365;
  const acres = kgYear / 1000 / tonnesPerAcreYear;
  const silageKg = silageDays > 0 ? animals * kgPerAnimalDay * silageDays : 0;
  return {
    tonnesPerYear: r1(kgYear / 1000),
    decimals: Math.ceil(acres * 100),
    silageKg: Math.round(silageKg),
    silageM3: r1(silageKg / p.silageKgPerM3),
  };
}

// ---------------------------------------------------------------- 9. milk price from fat and SNF

/** Two-axis milk price: a rate per kg of fat plus a rate per kg of SNF (1 L of milk ≈ 1.03 kg). */
export function milkPrice(fatPct: number, snfPct: number, fatRatePerKg: number, snfRatePerKg: number, litres = 1, p: ToolParams["milk"] = TOOL_DEFAULTS.milk) {
  if (!ok(fatPct, snfPct, fatRatePerKg, snfRatePerKg)) return null;
  const perKg = (fatPct / 100) * fatRatePerKg + (snfPct / 100) * snfRatePerKg;
  const perLitre = perKg * p.kgPerLitre;
  return { perKg: r2(perKg), perLitre: r2(perLitre), total: litres > 0 ? Math.round(perLitre * litres) : null };
}

// ---------------------------------------------------------------- 10. least-cost ration

/**
 * What is in each feed: dry matter (% of the feed as bought), and crude
 * protein and TDN (energy) as % of the dry matter. Typical values for
 * Bangladesh (BLRI / ICAR feed tables); a real feed can differ.
 * `rough` = roughage (straw, grass, silage). `maxPct` = most it should be of
 * the day's dry matter, for the animal's health (fat, palatability, bloat).
 */
export const FEEDS: Record<FeedId, { dm: number; cp: number; tdn: number; rough: boolean; maxPct: number }> = {
  rice_straw: { dm: 90, cp: 3.5, tdn: 40, rough: true, maxPct: 60 },
  napier: { dm: 18, cp: 9, tdn: 55, rough: true, maxPct: 100 },
  local_grass: { dm: 25, cp: 8, tdn: 52, rough: true, maxPct: 100 },
  maize_silage: { dm: 30, cp: 8, tdn: 65, rough: true, maxPct: 100 },
  legume_fodder: { dm: 20, cp: 18, tdn: 60, rough: true, maxPct: 40 },
  wheat_bran: { dm: 89, cp: 15.5, tdn: 68, rough: false, maxPct: 50 },
  rice_polish: { dm: 90, cp: 12.5, tdn: 70, rough: false, maxPct: 20 },
  maize: { dm: 89, cp: 9, tdn: 80, rough: false, maxPct: 40 },
  broken_rice: { dm: 88, cp: 8, tdn: 78, rough: false, maxPct: 25 },
  mustard_cake: { dm: 90, cp: 34, tdn: 72, rough: false, maxPct: 15 },
  soybean_meal: { dm: 90, cp: 46, tdn: 80, rough: false, maxPct: 15 },
  pulse_husk: { dm: 90, cp: 14, tdn: 60, rough: false, maxPct: 30 },
  molasses: { dm: 75, cp: 4, tdn: 72, rough: false, maxPct: 8 },
  ready_feed: { dm: 89, cp: 18, tdn: 70, rough: false, maxPct: 60 },
};

export type RationAnimal = {
  /** milking cow / dry cow / growing or fattening animal (cattle or buffalo). */
  kind: "milking" | "dry" | "growing";
  weightKg: number;
  milkL?: number;
  fatPct?: number;
  /** Daily gain wanted, kg (growing / fattening). */
  gainKg?: number;
  /** In the last 3 months of pregnancy. */
  pregnant?: boolean;
};

/**
 * What the animal needs in a day (kg): dry matter it can eat (a range), TDN and
 * crude protein, and the least share of roughage in the dry matter. Simplified
 * from NRC (1989) dairy and beef tables: maintenance from metabolic weight
 * (kg^0.75), plus milk by its fat %, plus daily gain, plus late pregnancy.
 */
export function rationNeeds(a: RationAnimal) {
  if (!ok(a.weightKg)) return null;
  const w = a.weightKg;
  const mw = Math.pow(w, 0.75);
  let tdn = 0.0353 * mw;
  let cp = 0.00355 * mw;
  let dm: number;
  let roughMin: number;
  if (a.kind === "milking") {
    const milkKg = Math.max(0, a.milkL ?? 0) * 1.03;
    const fat = a.fatPct && a.fatPct > 0 ? a.fatPct : 4;
    tdn += milkKg * (0.196 + 0.0315 * fat);
    cp += milkKg * (0.054 + 0.009 * fat);
    dm = 0.025 * w + 0.1 * milkKg;
    roughMin = 40;
  } else if (a.kind === "dry") {
    dm = 0.02 * w;
    roughMin = 60;
  } else {
    const gain = Math.max(0, a.gainKg ?? 0);
    tdn += gain * 3;
    cp += gain * 0.4;
    dm = 0.027 * w;
    roughMin = 35;
  }
  if (a.pregnant && a.kind !== "growing") {
    tdn += (0.7 * w) / 400;
    cp += (0.15 * w) / 400;
  }
  return { dmMin: 0.9 * dm, dmMax: Math.min(1.15 * dm, 0.04 * w), tdn, cp, roughMin };
}

/**
 * Minimise c·x subject to A·x = b (b ≥ 0), x ≥ 0, starting from a feasible basis
 * whose columns form an identity. Dense tableau, Bland's rule (no cycling).
 */
function simplex(A: number[][], b: number[], c: number[], basis: number[]) {
  const m = A.length;
  const n = c.length;
  const T = A.map((r) => [...r]);
  const rhs = [...b];
  const B = [...basis];
  for (let iter = 0; iter < 1000; iter++) {
    let enter = -1;
    for (let j = 0; j < n; j++) {
      let d = c[j];
      for (let i = 0; i < m; i++) d -= c[B[i]] * T[i][j];
      if (d < -1e-9) {
        enter = j;
        break;
      }
    }
    if (enter < 0) break;
    let leave = -1;
    let best = Infinity;
    for (let i = 0; i < m; i++) {
      if (T[i][enter] > 1e-9) {
        const ratio = rhs[i] / T[i][enter];
        if (ratio < best - 1e-12 || (Math.abs(ratio - best) <= 1e-12 && leave >= 0 && B[i] < B[leave])) {
          best = ratio;
          leave = i;
        }
      }
    }
    if (leave < 0) return null; // unbounded: cannot happen here (dry matter has a ceiling)
    const pv = T[leave][enter];
    for (let j = 0; j < n; j++) T[leave][j] /= pv;
    rhs[leave] /= pv;
    for (let i = 0; i < m; i++) {
      if (i === leave || Math.abs(T[i][enter]) < 1e-15) continue;
      const k = T[i][enter];
      for (let j = 0; j < n; j++) T[i][j] -= k * T[leave][j];
      rhs[i] -= k * rhs[leave];
    }
    B[leave] = enter;
  }
  const x = Array(n).fill(0) as number[];
  B.forEach((col, i) => (x[col] = Math.max(0, rhs[i])));
  return x;
}

export type FeedChoice = { id: FeedId; price: number; /** Most the farm has per animal per day, kg as bought (optional). */ maxKg?: number };

/**
 * The cheapest daily ration from the feeds the farmer has, at their prices,
 * that gives the animal its energy (TDN) and protein, inside what it can eat,
 * with enough roughage and no feed above its safe share. When the feeds can't
 * meet a need (e.g. no protein feed), the closest ration is returned with what
 * is short, so the farmer knows what to add.
 */
export function leastCostRation(animal: RationAnimal, choices: FeedChoice[]) {
  const need = rationNeeds(animal);
  if (!need) return null;
  const feeds = choices.filter((c, i) => RATION_FEEDS.includes(c.id) && Number.isFinite(c.price) && c.price >= 0 && choices.findIndex((d) => d.id === c.id) === i);
  if (feeds.length === 0) return { error: "noFeeds" as const };
  if (!feeds.some((c) => FEEDS[c.id].rough)) return { error: "noRoughage" as const };

  // Columns: dry matter (kg) of each feed, then shortfalls of TDN, protein and
  // dry matter (heavily penalised, so they are used only when unavoidable),
  // then one slack / surplus per row.
  const n = feeds.length;
  const SHORT_T = n;
  const SHORT_C = n + 1;
  const SHORT_D = n + 2;
  type Row = { a: number[]; extra: [number, number][]; rhs: number; basic: number | "slack" };
  const rows: Row[] = [];
  const f = feeds.map((c) => FEEDS[c.id]);
  // ≥ rows carry their shortfall as the starting basic column and a surplus (−1).
  rows.push({ a: f.map((x) => x.tdn / 100), extra: [[SHORT_T, 1]], rhs: need.tdn, basic: SHORT_T });
  rows.push({ a: f.map((x) => x.cp / 100), extra: [[SHORT_C, 1]], rhs: need.cp, basic: SHORT_C });
  rows.push({ a: f.map(() => 1), extra: [[SHORT_D, 1]], rhs: need.dmMin, basic: SHORT_D });
  // ≤ rows start with their slack (+1) as the basic column.
  rows.push({ a: f.map(() => 1), extra: [], rhs: need.dmMax, basic: "slack" });
  rows.push({ a: f.map((x) => need.roughMin / 100 - (x.rough ? 1 : 0)), extra: [], rhs: 0, basic: "slack" });
  f.forEach((x, i) => {
    if (x.maxPct < 100) rows.push({ a: f.map((_, j) => (j === i ? 1 : 0) - x.maxPct / 100), extra: [], rhs: 0, basic: "slack" });
    const max = feeds[i].maxKg;
    if (max !== undefined && Number.isFinite(max) && max >= 0) rows.push({ a: f.map((_, j) => (j === i ? 1 : 0)), extra: [], rhs: (max * x.dm) / 100, basic: "slack" });
  });
  const first = n + 3;
  const cols = first + rows.length;
  const A: number[][] = [];
  const basis: number[] = [];
  rows.forEach((r, i) => {
    const line = Array(cols).fill(0) as number[];
    r.a.forEach((v, j) => (line[j] = v));
    for (const [col, v] of r.extra) line[col] = v;
    line[first + i] = r.basic === "slack" ? 1 : -1;
    A.push(line);
    basis.push(r.basic === "slack" ? first + i : r.basic);
  });
  const cost = Array(cols).fill(0) as number[];
  feeds.forEach((c, j) => (cost[j] = c.price / (f[j].dm / 100)));
  cost[SHORT_T] = 1e5;
  cost[SHORT_C] = 1e5;
  cost[SHORT_D] = 1e4;
  const x = simplex(A, rows.map((r) => r.rhs), cost, basis);
  if (!x) return null;

  const items = feeds
    .map((c, j) => ({ id: c.id, dmKg: x[j], kg: (x[j] * 100) / f[j].dm, price: c.price }))
    .filter((it) => it.kg >= 0.05)
    .map((it) => ({ id: it.id, kg: r1(it.kg), dmKg: r2(it.dmKg), cost: r1(it.kg * it.price), rough: FEEDS[it.id].rough }))
    .sort((p, q) => Number(q.rough) - Number(p.rough) || q.kg - p.kg);
  const dm = feeds.reduce((s, _, j) => s + x[j], 0);
  const tdn = feeds.reduce((s, _, j) => s + (x[j] * f[j].tdn) / 100, 0);
  const cp = feeds.reduce((s, _, j) => s + (x[j] * f[j].cp) / 100, 0);
  const roughDm = feeds.reduce((s, _, j) => s + (f[j].rough ? x[j] : 0), 0);
  const costDay = feeds.reduce((s, c, j) => s + (x[j] * 100 * c.price) / f[j].dm, 0);
  // The concentrate part as a mix to make in bulk (% as bought).
  const conc = items.filter((it) => !it.rough);
  const concKg = conc.reduce((s, it) => s + it.kg, 0);
  const mix = concKg > 0 ? conc.map((it) => ({ id: it.id, pct: r1((it.kg / concKg) * 100) })) : [];
  const milkL = animal.kind === "milking" ? Math.max(0, animal.milkL ?? 0) : 0;
  return {
    error: null,
    items,
    costDay: Math.round(costDay),
    costPerLitre: milkL > 0 ? r2(costDay / milkL) : null,
    supply: { dm: r1(dm), tdn: r2(tdn), cp: r2(cp), roughPct: dm > 0 ? Math.round((roughDm / dm) * 100) : 0 },
    need: { dmMin: r1(need.dmMin), dmMax: r1(need.dmMax), tdn: r2(need.tdn), cp: r2(need.cp), roughMin: need.roughMin },
    short: { tdn: r2(Math.max(0, x[SHORT_T])), cp: r2(Math.max(0, x[SHORT_C])), dm: r1(Math.max(0, x[SHORT_D])) },
    mix,
    concentrateKg: r1(concKg),
    waterL: Math.round(animal.weightKg * 0.1 + milkL * 4),
    saltG: Math.round(30 + milkL * 2),
    mineralG: milkL > 0 ? 50 : 30,
  };
}

/** Default choices: every feed at the (admin-set) starting price. */
export const defaultFeedChoices = (prices: ToolParams["feedPrice"] = TOOL_DEFAULTS.feedPrice): FeedChoice[] => RATION_FEEDS.map((id) => ({ id, price: prices[id] }));
