// Health records, breeding events, sales and payments checked before saving
// (pure: no device code, so the rules are unit-tested). Same rules as the website.
import { parseNumber } from "./entries";

export const addDays = (iso: string, days: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
export const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`)) && new Date(`${v}T00:00:00Z`).toISOString().startsWith(v);

type Err<K extends string> = { ok: false; error: K };
const optionalNumber = (raw: string) => {
  const v = parseNumber(raw);
  return v === null ? { ok: true as const, v: null } : Number.isFinite(v) && v >= 0 ? { ok: true as const, v } : { ok: false as const };
};

// ---------------------------------------------------------------- health

export type HealthEntry = {
  cattle_ids: string[];
  record_date: string;
  record_type: string;
  product: string;
  interval_days: number | null;
  next_due_date: string | null;
  cost: number | null;
  notes: string | null;
};

export type HealthInput = { cattleIds: string[]; date: string; type: string; product: string; interval: string; cost: string; notes: string };

export function healthEntry(i: HealthInput, today: string, types: string[]):
  | { ok: true; entry: HealthEntry }
  | Err<"rec.err.animals" | "rec.err.type" | "rec.err.product" | "rec.err.date" | "rec.err.future" | "rec.err.interval" | "entry.err.number"> {
  const ids = [...new Set(i.cattleIds)];
  if (!ids.length) return { ok: false, error: "rec.err.animals" };
  if (!types.includes(i.type)) return { ok: false, error: "rec.err.type" };
  const product = i.product.trim();
  if (!product) return { ok: false, error: "rec.err.product" };
  if (!isDate(i.date)) return { ok: false, error: "rec.err.date" };
  if (i.date > today) return { ok: false, error: "rec.err.future" };
  const interval = parseNumber(i.interval);
  if (interval !== null && (!Number.isInteger(interval) || interval <= 0)) return { ok: false, error: "rec.err.interval" };
  const cost = optionalNumber(i.cost);
  if (!cost.ok) return { ok: false, error: "entry.err.number" };
  return {
    ok: true,
    entry: {
      cattle_ids: ids,
      record_date: i.date,
      record_type: i.type,
      product,
      interval_days: interval,
      next_due_date: interval ? addDays(i.date, interval) : null,
      cost: cost.v,
      notes: i.notes.trim() || null,
    },
  };
}

// ---------------------------------------------------------------- breeding

export const EVENT_TYPES = ["heat", "insemination", "pregnancy_check", "calving", "dry_off"] as const;
export type EventType = (typeof EVENT_TYPES)[number];
export const PREGNANCY_RESULTS = ["positive", "negative", "uncertain"] as const;

export type BreedingRules = { gestation_days: number; heat_cycle_days: number; goat_gestation_days: number; sheep_gestation_days: number };
export const DEFAULT_RULES: BreedingRules = { gestation_days: 283, heat_cycle_days: 21, goat_gestation_days: 150, sheep_gestation_days: 147 };

/** Days from service to birth, and between heats, for the animal's species. */
export function speciesRules(rules: BreedingRules | null, species: string | null) {
  const r = rules ?? DEFAULT_RULES;
  if (species === "goat") return { gestation: r.goat_gestation_days, heatCycle: 21 };
  if (species === "sheep") return { gestation: r.sheep_gestation_days, heatCycle: 17 };
  return { gestation: r.gestation_days, heatCycle: r.heat_cycle_days };
}

export type BreedingEntry = {
  cattle_id: string;
  event_type: EventType;
  event_date: string;
  bull_or_semen: string | null;
  technician: string | null;
  cost: number | null;
  heat_signs: string | null;
  result: string | null;
  expected_calving_date: string | null;
  notes: string | null;
  /** Calving only: the newborn to add (its type sets its sex). */
  calf: { tag_number: string; name: string | null; category: string } | null;
};

export type BreedingInput = {
  cattleId: string;
  species: string | null;
  type: string;
  date: string;
  semen: string;
  technician: string;
  cost: string;
  heatSigns: string[];
  result: string;
  notes: string;
  calfTag: string;
  calfName: string;
  calfCategory: string;
};

export function breedingEntry(i: BreedingInput, today: string, rules: BreedingRules | null):
  | { ok: true; entry: BreedingEntry; next: { kind: "calving" | "heat"; date: string } | null }
  | Err<"rec.err.animal" | "rec.err.type" | "rec.err.date" | "rec.err.future" | "rec.err.result" | "entry.err.number"> {
  if (!i.cattleId) return { ok: false, error: "rec.err.animal" };
  if (!(EVENT_TYPES as readonly string[]).includes(i.type)) return { ok: false, error: "rec.err.type" };
  if (!isDate(i.date)) return { ok: false, error: "rec.err.date" };
  if (i.date > today) return { ok: false, error: "rec.err.future" };
  const type = i.type as EventType;
  if (type === "pregnancy_check" && !(PREGNANCY_RESULTS as readonly string[]).includes(i.result)) return { ok: false, error: "rec.err.result" };
  const cost = optionalNumber(i.cost);
  if (!cost.ok) return { ok: false, error: "entry.err.number" };
  const r = speciesRules(rules, i.species);
  const expected = type === "insemination" ? addDays(i.date, r.gestation) : null;
  const tag = i.calfTag.trim();
  return {
    ok: true,
    entry: {
      cattle_id: i.cattleId,
      event_type: type,
      event_date: i.date,
      bull_or_semen: type === "insemination" ? i.semen.trim() || null : null,
      technician: type === "insemination" ? i.technician.trim() || null : null,
      cost: cost.v,
      heat_signs: type === "heat" && i.heatSigns.length ? i.heatSigns.join(", ") : null,
      result: type === "pregnancy_check" ? i.result : null,
      expected_calving_date: expected,
      notes: i.notes.trim() || null,
      calf: type === "calving" && tag ? { tag_number: tag, name: i.calfName.trim() || null, category: i.calfCategory } : null,
    },
    next: expected ? { kind: "calving", date: expected } : type === "heat" ? { kind: "heat", date: addDays(i.date, r.heatCycle) } : null,
  };
}

/** What a newborn can be: calves, kids or lambs. */
export function calfCategories(species: string | null) {
  if (species === "goat") return ["doeling", "buckling"];
  if (species === "sheep") return ["ewe_lamb", "ram_lamb"];
  return ["heifer", "bull"];
}

/** After giving birth a young female counts as an adult. */
export const ADULT_AFTER_BIRTH: Record<string, string> = { heifer: "cow", doeling: "doe", ewe_lamb: "ewe" };

// ---------------------------------------------------------------- sales

export const PRODUCTS = ["milk", "eggs", "animal", "birds", "manure", "other"] as const;
export type Product = (typeof PRODUCTS)[number];
export const UNITS: Record<Product, string[]> = {
  milk: ["litre", "kg"],
  eggs: ["piece", "hali", "dozen", "tray"],
  animal: ["head"],
  birds: ["kg"],
  manure: ["kg", "other"],
  other: ["other", "kg", "piece"],
};
export const PAY_METHODS = ["cash", "bkash", "nagad", "rocket", "bank", "other"] as const;

export type SaleEntry = {
  sale_date: string;
  product: Product;
  module: string;
  quantity: number;
  unit: string;
  unit_price: number | null;
  amount: number;
  paid_amount: number;
  buyer_id: string | null;
  cattle_id: string | null;
  flock_id: string | null;
  head_count: number | null;
  notes: string | null;
};

export type SaleInput = {
  date: string;
  product: string;
  unit: string;
  quantity: string;
  price: string;
  amount: string;
  paid: string;
  buyerId: string | null;
  animal: { id: string; species: string | null; is_fattening: boolean } | null;
  flock: { id: string; kind: string } | null;
  heads: string;
  notes: string;
};

/** Which part of the farm earned the money (as on the website). */
export function saleModule(product: Product, animal: SaleInput["animal"], flock: SaleInput["flock"]) {
  if (product === "milk") return "dairy";
  if (product === "birds") return "broiler";
  if (product === "animal" && animal) return animal.species === "goat" || animal.species === "sheep" ? "goat" : animal.is_fattening ? "fattening" : "dairy";
  if (product === "eggs" || flock) return "layer";
  return "general";
}

export function saleEntry(i: SaleInput, today: string):
  | { ok: true; entry: SaleEntry; due: number }
  | Err<"rec.err.product" | "rec.err.date" | "rec.err.future" | "sale.err.qty" | "sale.err.amount" | "sale.err.paid" | "sale.err.animal" | "sale.err.batch" | "sale.err.heads" | "entry.err.number"> {
  if (!(PRODUCTS as readonly string[]).includes(i.product)) return { ok: false, error: "rec.err.product" };
  const product = i.product as Product;
  if (!isDate(i.date)) return { ok: false, error: "rec.err.date" };
  if (i.date > today) return { ok: false, error: "rec.err.future" };
  const unit = UNITS[product].includes(i.unit) ? i.unit : UNITS[product][0];
  const qty = product === "animal" ? 1 : parseNumber(i.quantity);
  if (qty === null || !Number.isFinite(qty) || qty <= 0) return { ok: false, error: "sale.err.qty" };
  const price = optionalNumber(i.price);
  if (!price.ok) return { ok: false, error: "entry.err.number" };
  const amount = price.v !== null && product !== "animal" ? Math.round(qty * price.v * 100) / 100 : parseNumber(i.amount);
  if (amount === null || !Number.isFinite(amount) || amount <= 0) return { ok: false, error: "sale.err.amount" };
  if (product === "animal" && !i.animal) return { ok: false, error: "sale.err.animal" };
  let heads: number | null = null;
  if (product === "birds") {
    if (!i.flock) return { ok: false, error: "sale.err.batch" };
    heads = parseNumber(i.heads);
    if (heads === null || !Number.isInteger(heads) || heads <= 0) return { ok: false, error: "sale.err.heads" };
  }
  // Without a buyer the sale is cash: paid in full.
  const paidRaw = optionalNumber(i.paid);
  if (!paidRaw.ok) return { ok: false, error: "sale.err.paid" };
  const paid = i.buyerId ? Math.min(paidRaw.v ?? 0, amount) : amount;
  return {
    ok: true,
    due: Math.round((amount - paid) * 100) / 100,
    entry: {
      sale_date: i.date,
      product,
      module: saleModule(product, i.animal, i.flock),
      quantity: qty,
      unit,
      unit_price: product === "animal" ? amount : price.v,
      amount,
      paid_amount: paid,
      buyer_id: i.buyerId,
      cattle_id: product === "animal" ? (i.animal?.id ?? null) : null,
      flock_id: product === "eggs" || product === "birds" ? (i.flock?.id ?? null) : null,
      head_count: heads,
      notes: i.notes.trim() || null,
    },
  };
}

export type PaymentEntry = { buyer_id: string; pay_date: string; amount: number; method: string; notes: string | null };

export function paymentEntry(i: { buyerId: string | null; date: string; amount: string; method: string; notes: string }, today: string):
  | { ok: true; entry: PaymentEntry }
  | Err<"sale.err.buyer" | "rec.err.date" | "rec.err.future" | "sale.err.amount"> {
  if (!i.buyerId) return { ok: false, error: "sale.err.buyer" };
  if (!isDate(i.date)) return { ok: false, error: "rec.err.date" };
  if (i.date > today) return { ok: false, error: "rec.err.future" };
  const amount = parseNumber(i.amount);
  if (amount === null || !Number.isFinite(amount) || amount <= 0) return { ok: false, error: "sale.err.amount" };
  return {
    ok: true,
    entry: { buyer_id: i.buyerId, pay_date: i.date, amount, method: (PAY_METHODS as readonly string[]).includes(i.method) ? i.method : "cash", notes: i.notes.trim() || null },
  };
}

export type BuyerEntry = { id: string; name: string; phone: string | null; milk_rate: number | null; egg_rate: number | null };

export function buyerEntry(i: { id: string; name: string; phone: string; milkRate: string; eggRate: string }):
  | { ok: true; entry: BuyerEntry }
  | Err<"sale.err.name" | "entry.err.number"> {
  const name = i.name.trim();
  if (name.length < 2) return { ok: false, error: "sale.err.name" };
  const milk = optionalNumber(i.milkRate);
  const egg = optionalNumber(i.eggRate);
  if (!milk.ok || !egg.ok) return { ok: false, error: "entry.err.number" };
  return { ok: true, entry: { id: i.id, name, phone: i.phone.trim() || null, milk_rate: milk.v, egg_rate: egg.v } };
}

/** A random id, so a buyer added offline can be used for sales before it reaches the server. */
export function uuid(rand: () => number = Math.random) {
  const h = Array.from({ length: 32 }, () => Math.floor(rand() * 16).toString(16));
  h[12] = "4";
  h[16] = ((parseInt(h[16], 16) & 0x3) | 0x8).toString(16);
  const s = h.join("");
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
}

// ---------------------------------------------------------------- money in / out

export const SECTIONS = ["dairy", "fattening", "goat", "layer", "broiler", "general"] as const;
export type Section = (typeof SECTIONS)[number];

/** The farm's sections (what it keeps) plus "whole farm". */
export function farmSections(f: { has_dairy: boolean; has_fattening: boolean; has_goat: boolean; has_layer: boolean; has_broiler: boolean }): Section[] {
  return SECTIONS.filter((s) => s === "general" || f[`has_${s}` as const]);
}

export type TxnEntry = { txn_date: string; txn_type: "expense" | "income"; module: string; category: string; amount: number; quantity: number | null; unit_price: number | null; description: string | null };

export function txnEntry(i: { date: string; type: string; module: string; category: string; amount: string; quantity: string; rate: string; description: string }, today: string):
  | { ok: true; entry: TxnEntry }
  | Err<"rec.err.date" | "rec.err.future" | "txn.err.category" | "sale.err.amount" | "entry.err.number"> {
  if (!isDate(i.date)) return { ok: false, error: "rec.err.date" };
  if (i.date > today) return { ok: false, error: "rec.err.future" };
  if (!i.category) return { ok: false, error: "txn.err.category" };
  const qty = optionalNumber(i.quantity);
  const rate = optionalNumber(i.rate);
  if (!qty.ok || !rate.ok || qty.v === 0) return { ok: false, error: "entry.err.number" };
  // With both a quantity and a rate, the total is always quantity × rate (as on the website).
  const amount = qty.v !== null && rate.v !== null ? Math.round(qty.v * rate.v * 100) / 100 : parseNumber(i.amount);
  if (amount === null || !Number.isFinite(amount) || amount <= 0) return { ok: false, error: "sale.err.amount" };
  return {
    ok: true,
    entry: {
      txn_date: i.date,
      txn_type: i.type === "income" ? "income" : "expense",
      module: (SECTIONS as readonly string[]).includes(i.module) ? i.module : "general",
      category: i.category,
      amount,
      quantity: qty.v,
      unit_price: rate.v,
      description: i.description.trim() || null,
    },
  };
}

export type LedgerRow = { txn_type: string; module: string | null; amount: number };

/** Money in and out per section, and the farm's total. */
export function profitBy(rows: LedgerRow[]) {
  const by = new Map<string, { income: number; cost: number }>();
  for (const r of rows) {
    const key = r.module ?? "general";
    const x = by.get(key) ?? { income: 0, cost: 0 };
    if (r.txn_type === "income") x.income += Number(r.amount);
    else x.cost += Number(r.amount);
    by.set(key, x);
  }
  const sections = [...by.entries()]
    .map(([module, x]) => ({ module, ...x, profit: x.income - x.cost }))
    .sort((a, b) => SECTIONS.indexOf(a.module as Section) - SECTIONS.indexOf(b.module as Section));
  const total = sections.reduce((s, x) => ({ income: s.income + x.income, cost: s.cost + x.cost, profit: s.profit + x.profit }), { income: 0, cost: 0, profit: 0 });
  return { sections, total };
}

/** First and last day of this month, or of last month. */
export function monthRange(today: string, which: "this" | "last") {
  const [y, m] = today.split("-").map(Number);
  const d = which === "this" ? new Date(Date.UTC(y, m - 1, 1)) : new Date(Date.UTC(y, m - 2, 1));
  const from = d.toISOString().slice(0, 10);
  const to = which === "this" ? today : new Date(Date.UTC(y, m - 1, 0)).toISOString().slice(0, 10);
  return { from, to };
}

// ---------------------------------------------------------------- animals

/** The species an animal type belongs to (cattle when the type says nothing). */
export const speciesOfCategory = (meta: Record<string, unknown> | null | undefined) =>
  meta?.species === "goat" || meta?.species === "sheep" ? (meta.species as "goat" | "sheep") : "cattle";

export type AnimalEntry = {
  tag_number: string;
  name: string | null;
  category: string;
  breed: string | null;
  date_of_birth: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  mother_id: string | null;
  father: string | null;
  notes: string | null;
  status?: string;
  is_fattening?: boolean;
  fattening_start?: string | null;
  target_weight_kg?: number | null;
};

export type AnimalInput = {
  id: string | null;
  tag: string;
  name: string;
  category: string;
  breed: string;
  dob: string;
  purchaseDate: string;
  purchasePrice: string;
  motherId: string | null;
  father: string;
  notes: string;
  status: string;
  fattening: boolean;
  targetKg: string;
  startKg: string;
};

export function animalEntry(i: AnimalInput, today: string):
  | { ok: true; entry: AnimalEntry; startKg: number | null }
  | Err<"animal.err.tag" | "animal.err.type" | "rec.err.date" | "rec.err.future" | "animal.err.motherSelf" | "entry.err.number"> {
  const tag = i.tag.trim();
  if (!tag) return { ok: false, error: "animal.err.tag" };
  if (!i.category) return { ok: false, error: "animal.err.type" };
  for (const d of [i.dob, i.purchaseDate]) {
    if (d && !isDate(d)) return { ok: false, error: "rec.err.date" };
    if (d && d > today) return { ok: false, error: "rec.err.future" };
  }
  if (i.motherId && i.motherId === i.id) return { ok: false, error: "animal.err.motherSelf" };
  const price = optionalNumber(i.purchasePrice);
  const target = optionalNumber(i.targetKg);
  const start = optionalNumber(i.startKg);
  if (!price.ok || !target.ok || !start.ok) return { ok: false, error: "entry.err.number" };
  const entry: AnimalEntry = {
    tag_number: tag,
    name: i.name.trim() || null,
    category: i.category,
    breed: i.breed.trim() || null,
    date_of_birth: i.dob || null,
    purchase_date: i.purchaseDate || null,
    purchase_price: price.v,
    mother_id: i.motherId,
    father: i.father.trim() || null,
    notes: i.notes.trim() || null,
  };
  if (i.id) entry.status = i.status || "active";
  else if (i.fattening) {
    entry.is_fattening = true;
    entry.fattening_start = i.purchaseDate || today;
    entry.target_weight_kg = target.v;
  }
  return { ok: true, entry, startKg: !i.id && i.fattening && start.v ? start.v : null };
}

/** Live weight of cattle from a measuring tape (Schaeffer): girth² × length ÷ 10838, in cm and kg. */
export const tapeWeight = (girthCm: number, lengthCm: number) => Math.round(((girthCm * girthCm * lengthCm) / 10838) * 10) / 10;

export type WeightEntry = { weigh_date: string; weight_kg: number; method: "scale" | "tape"; heart_girth_cm: number | null; body_length_cm: number | null };

export function weightEntry(i: { date: string; method: string; kg: string; girth: string; length: string }, today: string):
  | { ok: true; entry: WeightEntry }
  | Err<"rec.err.date" | "rec.err.future" | "weight.err.kg" | "weight.err.tape"> {
  if (!isDate(i.date)) return { ok: false, error: "rec.err.date" };
  if (i.date > today) return { ok: false, error: "rec.err.future" };
  if (i.method === "tape") {
    const g = parseNumber(i.girth);
    const l = parseNumber(i.length);
    if (!g || !l || !Number.isFinite(g) || !Number.isFinite(l) || g < 30 || g > 300 || l < 30 || l > 300) return { ok: false, error: "weight.err.tape" };
    return { ok: true, entry: { weigh_date: i.date, weight_kg: tapeWeight(g, l), method: "tape", heart_girth_cm: g, body_length_cm: l } };
  }
  const kg = parseNumber(i.kg);
  if (kg === null || !Number.isFinite(kg) || kg <= 0 || kg > 2000) return { ok: false, error: "weight.err.kg" };
  return { ok: true, entry: { weigh_date: i.date, weight_kg: Math.round(kg * 10) / 10, method: "scale", heart_girth_cm: null, body_length_cm: null } };
}

// ---------------------------------------------------------------- birds

export type FlockNew = { name: string; kind: "layer" | "broiler" | "sonali"; breed: string | null; shed: string | null; placed_date: string; initial_count: number; age_at_placement_weeks: number; chick_price: number | null };

export function flockNew(i: { name: string; kind: string; breed: string; shed: string; date: string; count: string; ageWeeks: string; chickPrice: string }, today: string):
  | { ok: true; entry: FlockNew }
  | Err<"flock.err.name" | "flock.err.count" | "rec.err.date" | "rec.err.future" | "entry.err.number"> {
  const name = i.name.trim();
  if (!name) return { ok: false, error: "flock.err.name" };
  const count = parseNumber(i.count);
  if (count === null || !Number.isInteger(count) || count <= 0) return { ok: false, error: "flock.err.count" };
  if (!isDate(i.date)) return { ok: false, error: "rec.err.date" };
  if (i.date > today) return { ok: false, error: "rec.err.future" };
  const kind = i.kind === "broiler" || i.kind === "sonali" ? i.kind : "layer";
  const meat = kind !== "layer";
  const age = optionalNumber(i.ageWeeks);
  const price = optionalNumber(i.chickPrice);
  if (!age.ok || !price.ok || (age.v !== null && !Number.isInteger(age.v))) return { ok: false, error: "entry.err.number" };
  return {
    ok: true,
    entry: {
      name,
      kind,
      breed: i.breed.trim() || null,
      shed: i.shed.trim() || null,
      placed_date: i.date,
      initial_count: count,
      age_at_placement_weeks: meat ? 0 : (age.v ?? 0),
      chick_price: meat ? price.v : null,
    },
  };
}

/** A layer flock's age in weeks today. */
export const flockWeeks = (placedDate: string, ageAtPlacement: number, today: string) =>
  Math.max(0, Math.floor((Date.parse(today) - Date.parse(placedDate)) / (7 * 86_400_000))) + Number(ageAtPlacement ?? 0);

/** Layer flock numbers: hen-day % over the last 7 logged days, mortality and feed per dozen eggs. */
export function layerStats(initial: number, logs: { log_date: string; eggs_collected: number; mortality: number; culled: number; feed_kg: number | null }[]) {
  const sorted = [...logs].sort((a, b) => a.log_date.localeCompare(b.log_date));
  let alive = initial;
  const rows = sorted.map((l) => {
    const henDay = alive > 0 ? (Number(l.eggs_collected) / alive) * 100 : 0;
    alive = Math.max(0, alive - Number(l.mortality) - Number(l.culled));
    return { ...l, henDay, alive };
  });
  const last7 = rows.slice(-7);
  const deaths = sorted.reduce((s, l) => s + Number(l.mortality) + Number(l.culled), 0);
  const eggs = sorted.reduce((s, l) => s + Number(l.eggs_collected), 0);
  const feed = sorted.reduce((s, l) => s + Number(l.feed_kg ?? 0), 0);
  return {
    alive,
    henDay7: last7.length ? last7.reduce((s, r) => s + r.henDay, 0) / last7.length : 0,
    mortalityPct: initial > 0 ? (deaths / initial) * 100 : 0,
    deaths,
    eggs,
    feedPerDozen: eggs > 0 ? feed / (eggs / 12) : null,
    rows,
  };
}

// ---------------------------------------------------------------- stock

export const ITEM_KINDS = ["feed", "medicine", "vaccine", "supplement", "other"] as const;
export const ITEM_UNITS = ["kg", "bag", "litre", "ml", "dose", "piece", "packet", "bottle"] as const;
export const STOCK_SECTIONS = ["dairy", "layer", "general"] as const;

export type StockItemEntry = { name: string; kind: string; unit: string; unit_kg: number | null; module: string; low_stock: number | null; notes: string | null };

export function stockItemEntry(i: { name: string; kind: string; unit: string; unitKg: string; module: string; lowStock: string; notes: string }):
  | { ok: true; entry: StockItemEntry }
  | Err<"stock.err.name" | "entry.err.number"> {
  const name = i.name.trim();
  if (!name) return { ok: false, error: "stock.err.name" };
  const unitKg = optionalNumber(i.unitKg);
  const low = optionalNumber(i.lowStock);
  if (!unitKg.ok || !low.ok) return { ok: false, error: "entry.err.number" };
  return {
    ok: true,
    entry: {
      name,
      kind: (ITEM_KINDS as readonly string[]).includes(i.kind) ? i.kind : "feed",
      unit: (ITEM_UNITS as readonly string[]).includes(i.unit) ? i.unit : "kg",
      unit_kg: i.unit === "bag" ? unitKg.v : null,
      module: (STOCK_SECTIONS as readonly string[]).includes(i.module) ? i.module : "general",
      low_stock: low.v,
      notes: i.notes.trim() || null,
    },
  };
}

export type StockMoveEntry = {
  move_date: string;
  move_type: "purchase" | "use" | "adjust";
  quantity: number;
  unit_cost: number | null;
  total_cost: number | null;
  module: string | null;
  flock_id: string | null;
  supplier: string | null;
  notes: string | null;
};

/** A purchase, a use, or a count (the count stores the difference from what the app shows). */
export function stockMoveEntry(
  i: { type: string; date: string; qty: string; price: string; amount: string; counted: string; onHand: number; module: string; flockId: string | null; supplier: string; notes: string },
  today: string,
):
  | { ok: true; entry: StockMoveEntry }
  | { ok: true; entry: null }
  | Err<"rec.err.date" | "rec.err.future" | "sale.err.qty" | "stock.err.count" | "entry.err.number"> {
  if (!isDate(i.date)) return { ok: false, error: "rec.err.date" };
  if (i.date > today) return { ok: false, error: "rec.err.future" };
  const type = i.type === "use" || i.type === "adjust" ? i.type : "purchase";
  let quantity: number;
  if (type === "adjust") {
    const counted = parseNumber(i.counted);
    if (counted === null || !Number.isFinite(counted) || counted < 0) return { ok: false, error: "stock.err.count" };
    quantity = Math.round((counted - i.onHand) * 1000) / 1000;
    if (quantity === 0) return { ok: true, entry: null };
  } else {
    const q = parseNumber(i.qty);
    if (q === null || !Number.isFinite(q) || q <= 0) return { ok: false, error: "sale.err.qty" };
    quantity = q;
  }
  let unitCost: number | null = null;
  let totalCost: number | null = null;
  if (type === "purchase") {
    const price = optionalNumber(i.price);
    const amount = optionalNumber(i.amount);
    if (!price.ok || !amount.ok) return { ok: false, error: "entry.err.number" };
    unitCost = price.v;
    totalCost = price.v !== null ? Math.round(quantity * price.v * 100) / 100 : amount.v;
  }
  return {
    ok: true,
    entry: {
      move_date: i.date,
      move_type: type,
      quantity,
      unit_cost: unitCost,
      total_cost: totalCost,
      module: type === "use" && (STOCK_SECTIONS as readonly string[]).includes(i.module) ? i.module : null,
      flock_id: type === "use" ? i.flockId : null,
      supplier: type === "purchase" ? i.supplier.trim() || null : null,
      notes: i.notes.trim() || null,
    },
  };
}

/** Days of stock left at the last 30 days' rate of use (null when nothing was used). */
export function daysLeft(onHand: number, used30d: number) {
  const perDay = Number(used30d) / 30;
  return perDay > 0 ? Math.max(0, Math.floor(Number(onHand) / perDay)) : null;
}

// ---------------------------------------------------------------- staff

export const STAFF_SECTIONS = ["dairy", "layer", "both"] as const;
export const PAY_TYPES = ["salary", "advance", "bonus"] as const;
export const ATTENDANCE = ["present", "absent", "half_day", "leave"] as const;

export type StaffEntry = { name: string; phone: string | null; position: string | null; module: string; monthly_salary: number; join_date: string; notes: string | null };

export function staffEntry(i: { name: string; phone: string; position: string; module: string; salary: string; joinDate: string; notes: string }, today: string):
  | { ok: true; entry: StaffEntry }
  | Err<"staff.err.name" | "entry.err.number" | "rec.err.date" | "rec.err.future"> {
  const name = i.name.trim();
  if (!name) return { ok: false, error: "staff.err.name" };
  const salary = optionalNumber(i.salary);
  if (!salary.ok) return { ok: false, error: "entry.err.number" };
  if (i.joinDate && !isDate(i.joinDate)) return { ok: false, error: "rec.err.date" };
  if (i.joinDate && i.joinDate > today) return { ok: false, error: "rec.err.future" };
  return {
    ok: true,
    entry: {
      name,
      phone: i.phone.trim() || null,
      position: i.position || null,
      module: (STAFF_SECTIONS as readonly string[]).includes(i.module) ? i.module : "both",
      monthly_salary: salary.v ?? 0,
      join_date: i.joinDate || today,
      notes: i.notes.trim() || null,
    },
  };
}

export type StaffPayEntry = { pay_month: string; pay_type: string; amount: number; paid_on: string; note: string | null };

export function staffPayEntry(i: { month: string; type: string; amount: string; paidOn: string; note: string }, today: string):
  | { ok: true; entry: StaffPayEntry }
  | Err<"staff.err.month" | "sale.err.amount" | "rec.err.date" | "rec.err.future"> {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(i.month)) return { ok: false, error: "staff.err.month" };
  const amount = parseNumber(i.amount);
  if (amount === null || !Number.isFinite(amount) || amount <= 0) return { ok: false, error: "sale.err.amount" };
  if (!isDate(i.paidOn)) return { ok: false, error: "rec.err.date" };
  if (i.paidOn > today) return { ok: false, error: "rec.err.future" };
  return { ok: true, entry: { pay_month: `${i.month}-01`, pay_type: (PAY_TYPES as readonly string[]).includes(i.type) ? i.type : "salary", amount, paid_on: i.paidOn, note: i.note.trim() || null } };
}

/** "2026-10" moved by some months. */
export function shiftMonth(month: string, by: number) {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + by, 1)).toISOString().slice(0, 7);
}

// ---------------------------------------------------------------- doctors' entries

const pairs = (o: Record<string, string | number | null | undefined>) =>
  Object.entries(o).filter((e): e is [string, string | number] => e[1] !== null && e[1] !== undefined && e[1] !== "").map(([k, v]) => [k, String(v)] as [string, string]);

/** A health entry as the website's form fields (a doctor's entry goes to approval through them). */
export function healthFields(e: HealthEntry, id?: string): [string, string][] {
  return [
    ...(id ? [["id", id] as [string, string]] : e.cattle_ids.map((c) => ["cattle_id", c] as [string, string])),
    ...pairs({ record_type: e.record_type, product: e.product, record_date: e.record_date, interval_days: e.interval_days, cost: e.cost, description: e.notes }),
  ];
}

/** A breeding entry as the website's form fields. */
export function breedingFields(e: BreedingEntry, id?: string): [string, string][] {
  return [
    ...(id ? [["id", id] as [string, string]] : [["cattle_id", e.cattle_id] as [string, string]]),
    ...pairs({
      event_type: id ? null : e.event_type,
      event_date: e.event_date,
      bull_or_semen: e.bull_or_semen,
      technician: e.technician,
      cost: e.cost,
      result: e.result,
      expected_calving_date: e.expected_calving_date,
      notes: e.notes,
      calf_tag: e.calf?.tag_number,
      calf_name: e.calf?.name,
      calf_category: e.calf?.category,
    }),
    ...(e.heat_signs ? e.heat_signs.split(", ").map((s) => ["heat_sign", s] as [string, string]) : []),
  ];
}

// ---------------------------------------------------------------- doctors' console

const TRACKED = ["vaccination", "parasite_control", "deworming"];

/**
 * Overdue vaccines / dewormings, as on the website's health board: only the
 * newest record per animal + type + product counts (renewing clears it).
 */
export function overdueCount(
  records: { cattle_id: string; record_type: string; product: string | null; description: string | null; record_date: string; next_due_date: string | null }[],
  activeIds: Set<string>,
  today: string,
) {
  const newest = new Map<string, (typeof records)[number]>();
  for (const r of records) {
    if (!TRACKED.includes(r.record_type)) continue;
    const key = [r.cattle_id, r.record_type, (r.product ?? r.description ?? "").trim().toLowerCase()].join("|");
    const cur = newest.get(key);
    if (!cur || r.record_date > cur.record_date) newest.set(key, r);
  }
  return [...newest.values()].filter((r) => r.next_due_date && r.next_due_date < today && activeIds.has(r.cattle_id)).length;
}
