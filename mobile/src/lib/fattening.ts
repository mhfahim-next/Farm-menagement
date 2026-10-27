// Copied from the website (src/lib/fattening.ts) so both show the same numbers; change both together.
// Fattening cattle and goats for sale (Qurbani): growth, projected weight on
// the sale day, cost so far, break-even price and expected profit.
// Pure functions (no I/O) so the rules are easy to check.

export type WeightPoint = { date: string; kg: number };

export type FattenInput = {
  /** When fattening started (purchase or the day it was marked). */
  startDate: string;
  purchasePrice: number;
  weights: WeightPoint[];
  /** Medicine, vet and breeding costs recorded for this animal. */
  directCosts: number;
  /** Estimated feed and care per day (farm setting for this species). */
  dailyCost: number;
  /** Live-weight price per kg the farmer expects (farm setting). */
  pricePerKg: number;
  /** The sale day: Qurbani or the farm's own date. */
  targetDate: string | null;
  today: string;
  /** Set once the animal is sold. */
  sale: { date: string; amount: number } | null;
};

export type FattenStats = {
  daysOnFeed: number;
  startKg: number | null;
  currentKg: number | null;
  currentDate: string | null;
  gainKg: number | null;
  /** Average daily gain, kg/day, between the first and latest weights. */
  adg: number | null;
  daysLeft: number | null;
  projectedKg: number | null;
  costSoFar: number;
  /** Total cost if kept until the sale day. */
  costAtTarget: number;
  /** Price per kg live weight needed on the sale day to cover all costs. */
  breakEvenPerKg: number | null;
  estValue: number | null;
  estProfit: number | null;
  /** After the sale: what it brought and the real profit. */
  saleAmount: number | null;
  realProfit: number | null;
};

export const daysBetween = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);

export function fattenStats(x: FattenInput): FattenStats {
  const ws = [...x.weights].filter((w) => w.kg > 0).sort((a, b) => a.date.localeCompare(b.date));
  // Growth is measured from the first weight on or after the start (or the last one before it).
  const fromStart = ws.filter((w) => w.date >= x.startDate);
  const before = ws.filter((w) => w.date < x.startDate).at(-1);
  const first = fromStart[0] ?? before ?? null;
  const last = ws.at(-1) ?? null;
  const span = first && last ? daysBetween(first.date, last.date) : 0;
  const adg = first && last && span > 0 ? (last.kg - first.kg) / span : null;

  const endDay = x.sale?.date ?? x.today;
  const daysOnFeed = Math.max(0, daysBetween(x.startDate, endDay));
  const costSoFar = x.purchasePrice + x.directCosts + x.dailyCost * daysOnFeed;

  const daysLeft = x.targetDate && !x.sale ? Math.max(0, daysBetween(x.today, x.targetDate)) : null;
  const projectedKg =
    last && daysLeft !== null ? last.kg + (adg !== null && adg > 0 ? adg * (daysLeft + Math.max(0, daysBetween(last.date, x.today))) : 0) : null;
  const costAtTarget = costSoFar + x.dailyCost * (daysLeft ?? 0);
  const estValue = projectedKg !== null && x.pricePerKg > 0 ? projectedKg * x.pricePerKg : null;

  return {
    daysOnFeed,
    startKg: first?.kg ?? null,
    currentKg: last?.kg ?? null,
    currentDate: last?.date ?? null,
    gainKg: first && last ? last.kg - first.kg : null,
    adg,
    daysLeft,
    projectedKg,
    costSoFar,
    costAtTarget,
    breakEvenPerKg: projectedKg && projectedKg > 0 ? costAtTarget / projectedKg : null,
    estValue,
    estProfit: estValue !== null ? estValue - costAtTarget : null,
    saleAmount: x.sale?.amount ?? null,
    realProfit: x.sale ? x.sale.amount - costSoFar : null,
  };
}
