// Copied from the website (src/lib/tools.ts) so both give the same numbers; change both together.
// Farm calculators (the Tools menu on the website and in the app). Pure
// functions with no imports, so the app keeps an exact copy. All results are
// estimates from commonly used rules of thumb; the pages say so.

const r1 = (n: number) => Math.round(n * 10) / 10;
const r2 = (n: number) => Math.round(n * 100) / 100;
const ok = (...ns: number[]) => ns.every((n) => Number.isFinite(n) && n > 0);

// ---------------------------------------------------------------- 1. weight from a tape

export type LengthUnit = "cm" | "in";

/**
 * Live weight (kg) from heart girth and body length (Schaeffer's formula,
 * metric: girth² × length ÷ 10,838). Used for cattle, goats and sheep alike;
 * expect roughly ±10 %.
 */
export function tapeWeightKg(girth: number, length: number, unit: LengthUnit = "cm") {
  if (!ok(girth, length)) return null;
  const k = unit === "in" ? 2.54 : 1;
  const kg = ((girth * k) ** 2 * (length * k)) / 10838;
  return { kg: r1(kg), low: r1(kg * 0.9), high: r1(kg * 1.1) };
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
export function dairyRation(weightKg: number, milkL: number, fatPct = 4): Ration | null {
  if (!ok(weightKg) || !(milkL >= 0)) return null;
  const upkeep = weightKg <= 200 ? 1 : weightKg <= 350 ? 1.5 : 2;
  const concentrate = upkeep + milkL / (fatPct >= 4.5 ? 2 : 2.5);
  const dm = weightKg * 0.03;
  const green = weightKg * 0.08;
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
export function fatteningRation(weightKg: number, gainKgPerDay: number): Ration | null {
  if (!ok(weightKg) || !(gainKgPerDay >= 0)) return null;
  const concentrate = weightKg * 0.01 + gainKgPerDay * 1.5;
  const dm = weightKg * 0.028;
  const green = weightKg * 0.06;
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

export const MIX_INGREDIENTS = ["wheat_bran", "maize", "oil_cake", "pulse_husk", "salt", "minerals"] as const;
export type Ingredient = (typeof MIX_INGREDIENTS)[number];

/** Home-made concentrate mixes (% by weight). */
export const MIXES: Record<"dairy" | "fattening", Record<Ingredient, number>> = {
  dairy: { wheat_bran: 40, maize: 25, oil_cake: 20, pulse_husk: 12, salt: 1, minerals: 2 },
  fattening: { maize: 30, wheat_bran: 30, oil_cake: 20, pulse_husk: 17, salt: 1, minerals: 2 },
};

/** kg of each ingredient for `totalKg` of mix, and its cost per kg when every price is known. */
export function mixFor(kind: "dairy" | "fattening", totalKg: number, prices: Partial<Record<Ingredient, number>> = {}) {
  const mix = MIXES[kind];
  const rows = MIX_INGREDIENTS.map((i) => ({ ingredient: i, pct: mix[i], kg: r2((totalKg * mix[i]) / 100), price: prices[i] ?? null }));
  const priced = rows.every((r) => r.price !== null && Number.isFinite(r.price) && r.price >= 0);
  const costPerKg = priced ? r2(rows.reduce((s, r) => s + (r.pct * (r.price as number)) / 100, 0)) : null;
  return { rows, costPerKg, cost: costPerKg !== null ? r2(costPerKg * totalKg) : null };
}

// ---------------------------------------------------------------- 3. poultry feed and water

export type BirdKind = "layer" | "broiler" | "sonali";

/** Typical feed per bird per day (g), by week of age (last value from then on). */
const FEED_G: Record<BirdKind, number[]> = {
  layer: [10, 18, 25, 31, 38, 43, 48, 53, 58, 58, 63, 63, 68, 68, 73, 73, 80, 90, 112],
  broiler: [22, 55, 95, 135, 170, 195],
  sonali: [10, 18, 26, 34, 42, 50, 56, 62, 68],
};

export function poultryFeed(kind: BirdKind, birds: number, ageDays: number, opts: { bagPrice?: number; bagKg?: number; hot?: boolean } = {}) {
  if (!ok(birds) || !(ageDays >= 0)) return null;
  const table = FEED_G[kind];
  const week = Math.min(table.length, Math.floor(ageDays / 7) + 1);
  const g = table[week - 1];
  const kgDay = (g * birds) / 1000;
  const bagKg = opts.bagKg && opts.bagKg > 0 ? opts.bagKg : 50;
  const bagsMonth = (kgDay * 30) / bagKg;
  const costDay = opts.bagPrice && opts.bagPrice > 0 ? (kgDay / bagKg) * opts.bagPrice : null;
  return {
    week,
    gPerBird: g,
    kgPerDay: r1(kgDay),
    // Birds drink about twice what they eat; more in hot weather.
    waterLPerDay: r1(kgDay * (opts.hot ? 2.5 : 2)),
    bagsPerMonth: r1(bagsMonth),
    costPerDay: costDay !== null ? Math.round(costDay) : null,
    costPerMonth: costDay !== null ? Math.round(costDay * 30) : null,
  };
}

// ---------------------------------------------------------------- 4. pregnancy dates

export type Species = "cattle" | "buffalo" | "goat" | "sheep";
const PREG: Record<Species, { gestation: number; check: number; cycle: number; dry: number }> = {
  cattle: { gestation: 283, check: 60, cycle: 21, dry: 60 },
  buffalo: { gestation: 310, check: 60, cycle: 21, dry: 60 },
  goat: { gestation: 150, check: 45, cycle: 21, dry: 45 },
  sheep: { gestation: 147, check: 45, cycle: 17, dry: 45 },
};

const addDays = (iso: string, n: number) => new Date(Date.parse(iso + "T00:00:00Z") + n * 86_400_000).toISOString().slice(0, 10);
const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v + "T00:00:00Z"));

/** From the date of insemination or mating: when to check, the next heat if she didn't hold, drying off and the birth. */
export function pregnancyDates(species: Species, bredOn: string, today: string, gestationDays?: number) {
  if (!isDate(bredOn)) return null;
  const p = PREG[species];
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
export function meatValue(species: "cattle" | "goat", liveKg: number, price?: number, cost?: number) {
  if (!ok(liveKg)) return null;
  const [lo, hi] = species === "cattle" ? [0.5, 0.55] : [0.45, 0.5];
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

export const UNIT_GROUPS = {
  weight: { kg: 1, g: 0.001, maund: 40, seer: 0.9331 },
  count: { piece: 1, hali: 4, dozen: 12, tray: 30 },
  length: { cm: 1, inch: 2.54, foot: 30.48, metre: 100, hand: 45.72 },
  land: { decimal: 40.4686, katha: 66.89, bigha: 1337.8, acre: 4046.86, sqft: 0.092903 },
} as const;
export type UnitGroup = keyof typeof UNIT_GROUPS;

export function convertUnit<G extends UnitGroup>(group: G, value: number, from: keyof (typeof UNIT_GROUPS)[G], to: keyof (typeof UNIT_GROUPS)[G]) {
  if (!Number.isFinite(value)) return null;
  const units = UNIT_GROUPS[group] as Record<string, number>;
  const v = (value * units[from as string]) / units[to as string];
  return Math.round(v * 1000) / 1000;
}

// ---------------------------------------------------------------- 7. medicine dose

/** Dose for an animal's weight from the label's mg per kg, as ml of liquid or number of tablets (to the quarter). */
export function doseFor(weightKg: number, mgPerKg: number, strength: { mgPerMl?: number; mgPerTablet?: number }) {
  if (!ok(weightKg, mgPerKg)) return null;
  const mg = weightKg * mgPerKg;
  return {
    mg: r1(mg),
    ml: strength.mgPerMl && strength.mgPerMl > 0 ? r1(mg / strength.mgPerMl) : null,
    tablets: strength.mgPerTablet && strength.mgPerTablet > 0 ? Math.round((mg / strength.mgPerTablet) * 4) / 4 : null,
  };
}

// ---------------------------------------------------------------- 8. fodder land and silage

/**
 * Green grass for the herd for a year, and the land it needs at a given yield
 * (Napier gives about 60–80 t per acre a year). Silage for a lean period:
 * how many kg and roughly how much space (about 600 kg per cubic metre).
 */
export function fodderPlan(animals: number, kgPerAnimalDay: number, tonnesPerAcreYear: number, silageDays = 0) {
  if (!ok(animals, kgPerAnimalDay, tonnesPerAcreYear)) return null;
  const kgYear = animals * kgPerAnimalDay * 365;
  const acres = kgYear / 1000 / tonnesPerAcreYear;
  const silageKg = silageDays > 0 ? animals * kgPerAnimalDay * silageDays : 0;
  return {
    tonnesPerYear: r1(kgYear / 1000),
    decimals: Math.ceil(acres * 100),
    silageKg: Math.round(silageKg),
    silageM3: r1(silageKg / 600),
  };
}

// ---------------------------------------------------------------- 9. milk price from fat and SNF

/** Two-axis milk price: a rate per kg of fat plus a rate per kg of SNF (1 L of milk ≈ 1.03 kg). */
export function milkPrice(fatPct: number, snfPct: number, fatRatePerKg: number, snfRatePerKg: number, litres = 1) {
  if (!ok(fatPct, snfPct, fatRatePerKg, snfRatePerKg)) return null;
  const perKg = (fatPct / 100) * fatRatePerKg + (snfPct / 100) * snfRatePerKg;
  const perLitre = perKg * 1.03;
  return { perKg: r2(perKg), perLitre: r2(perLitre), total: litres > 0 ? Math.round(perLitre * litres) : null };
}
