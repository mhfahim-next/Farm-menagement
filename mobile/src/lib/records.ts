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
