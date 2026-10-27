// Copied from the website (src/lib/animal-profit.ts) so both show the same numbers; change both together.
// Profit per animal over a period: what each cow / goat / fattening animal
// brought in (its milk, its sale) against what it cost (purchase, its own
// medicine and breeding, and a share of its section's shared spending such as
// feed and labour, split by days on the farm).
// Pure functions (no I/O) so the rules are easy to check.

export type AnimalSection = "dairy" | "goat" | "fattening";

export type AnimalProfitData = {
  animals: {
    id: string;
    tag_number: string;
    name: string | null;
    category: string;
    status: string;
    species: string | null;
    is_fattening: boolean;
    /** Only when bought inside the period. */
    purchase_price: number | null;
    joined: string;
    left: string | null;
    milk_litres: number;
    direct_cost: number;
    sale_amount: number;
  }[];
  /** Section ("module") spending in the period, without costs already booked to one animal. */
  spend: Record<string, number>;
  milk_sold_litres: number;
  milk_sales_amount: number;
  /** Average milk rate of the farm's buyers (used when no milk was sold in the period). */
  milk_rate: number | null;
};

export type FarmSections = { has_dairy: boolean; has_layer: boolean; has_goat?: boolean; has_fattening?: boolean; has_broiler?: boolean };

export type AnimalProfitRow = {
  id: string;
  tag_number: string;
  name: string | null;
  category: string;
  status: string;
  section: AnimalSection;
  days: number;
  milkLitres: number;
  milkIncome: number;
  saleIncome: number;
  income: number;
  purchase: number;
  directCost: number;
  sharedCost: number;
  cost: number;
  profit: number;
  /** Profit per day on the farm in the period. */
  perDay: number;
};

export const sectionOf = (a: { species: string | null; is_fattening: boolean }): AnimalSection =>
  a.species === "goat" || a.species === "sheep" ? "goat" : a.is_fattening ? "fattening" : "dairy";

const DAY = 86_400_000;
const n = (v: unknown) => Number(v ?? 0) || 0;

/** Days the animal was on the farm inside the period (both ends counted). */
export function daysInPeriod(joined: string, left: string | null, from: string, to: string) {
  const start = Math.max(Date.parse(joined), Date.parse(from));
  const end = Math.min(Date.parse(left ?? to), Date.parse(to));
  return end < start ? 0 : Math.round((end - start) / DAY) + 1;
}

/** Price per litre: from milk sold in the period, else the buyers' usual rate. */
export function milkPrice(d: Pick<AnimalProfitData, "milk_sold_litres" | "milk_sales_amount" | "milk_rate">) {
  if (n(d.milk_sold_litres) > 0 && n(d.milk_sales_amount) > 0) return n(d.milk_sales_amount) / n(d.milk_sold_litres);
  return d.milk_rate && n(d.milk_rate) > 0 ? n(d.milk_rate) : null;
}

/**
 * Money each section has to share between its animals: its own spending plus
 * its part of the farm-wide ("general") spending, split between the sections
 * the farm keeps in proportion to their own spending (equally if none).
 */
export function sectionPools(spend: Record<string, number>, farm: FarmSections) {
  const kept: Record<string, boolean> = {
    dairy: farm.has_dairy,
    layer: farm.has_layer,
    goat: Boolean(farm.has_goat),
    fattening: Boolean(farm.has_fattening),
    broiler: Boolean(farm.has_broiler),
  };
  const sections = Object.keys(kept).filter((k) => kept[k]);
  const own = (k: string) => n(spend[k]);
  const total = sections.reduce((s, k) => s + own(k), 0);
  const general = n(spend.general);
  const share = (k: string) => (!kept[k] ? 0 : total > 0 ? own(k) / total : 1 / (sections.length || 1));
  return {
    dairy: own("dairy") + general * share("dairy"),
    goat: own("goat") + general * share("goat"),
    fattening: own("fattening") + general * share("fattening"),
  } satisfies Record<AnimalSection, number>;
}

export function animalProfits(d: AnimalProfitData, farm: FarmSections, period: { from: string; to: string }) {
  const price = milkPrice(d);
  const pools = sectionPools(d.spend, farm);
  const rows0 = d.animals.map((a) => ({ a, section: sectionOf(a), days: daysInPeriod(a.joined, a.left, period.from, period.to) }));
  const daysBySection: Record<AnimalSection, number> = { dairy: 0, goat: 0, fattening: 0 };
  for (const r of rows0) daysBySection[r.section] += r.days;

  const rows: AnimalProfitRow[] = rows0.map(({ a, section, days }) => {
    const milkLitres = n(a.milk_litres);
    const milkIncome = price !== null ? milkLitres * price : 0;
    const saleIncome = n(a.sale_amount);
    const purchase = n(a.purchase_price);
    const directCost = n(a.direct_cost);
    const sharedCost = daysBySection[section] > 0 ? (pools[section] * days) / daysBySection[section] : 0;
    const income = milkIncome + saleIncome;
    const cost = purchase + directCost + sharedCost;
    const profit = income - cost;
    return {
      id: a.id,
      tag_number: a.tag_number,
      name: a.name,
      category: a.category,
      status: a.status,
      section,
      days,
      milkLitres,
      milkIncome,
      saleIncome,
      income,
      purchase,
      directCost,
      sharedCost,
      cost,
      profit,
      perDay: days > 0 ? profit / days : 0,
    };
  });

  const sum = (k: "income" | "cost" | "profit") => rows.reduce((s, r) => s + r[k], 0);
  return {
    rows: rows.sort((x, y) => y.profit - x.profit),
    milkPrice: price,
    /** Milk was recorded but there is no price to value it with. */
    milkPriceMissing: price === null && rows.some((r) => r.milkLitres > 0),
    totals: { income: sum("income"), cost: sum("cost"), profit: sum("profit") },
  };
}
