// Broiler and Sonali batches: how a meat batch is doing.
// Pure functions (no I/O) so the rules are easy to check and reuse.

/** Weight of a day-old chick, used for weight gained (FCR). */
export const CHICK_WEIGHT_KG = 0.042;

export type BatchLog = {
  log_date: string;
  mortality: number;
  culled: number;
  feed_kg: number | null;
  avg_weight_g?: number | null;
};

export type BatchInput = {
  initialCount: number;
  placedDate: string;
  chickPrice: number | null;
  logs: BatchLog[];
  /** Birds sold so far, their weight (kg) and what they brought in. */
  soldBirds: number;
  soldKg: number;
  salesAmount: number;
  /** Feed taken from stock for this batch (at its average cost). */
  feedCost: number;
  /** Medicine and vaccines recorded for this batch. */
  medicineCost: number;
  /** Date to count the age up to: today, or the last day of a closed batch. */
  asOf: string;
};

export type BatchStats = {
  ageDays: number;
  live: number;
  deaths: number;
  /** Dead or culled, as % of chicks placed. */
  mortalityPct: number;
  feedKg: number;
  /** Latest sample live weight, grams. */
  latestWeightG: number | null;
  latestWeightDate: string | null;
  /** Live birds × latest sample weight. */
  liveKg: number | null;
  /** Sold + still alive, kg (needs a sample weight unless everything is sold). */
  producedKg: number | null;
  /** Feed conversion ratio: kg feed per kg of weight gained. Lower is better. */
  fcr: number | null;
  /** European Production Efficiency Factor: higher is better (300+ is very good for broilers). */
  epef: number | null;
  chickCost: number;
  totalCost: number;
  costPerKg: number | null;
  costPerBird: number | null;
  salesAmount: number;
  /** Money in minus money out so far. */
  profit: number;
};

const days = (from: string, to: string) => Math.max(0, Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000));

export function batchStats(b: BatchInput): BatchStats {
  const logs = [...b.logs].sort((x, y) => x.log_date.localeCompare(y.log_date));
  const deaths = logs.reduce((s, l) => s + Number(l.mortality) + Number(l.culled), 0);
  const live = Math.max(0, b.initialCount - deaths - b.soldBirds);
  const feedKg = logs.reduce((s, l) => s + Number(l.feed_kg ?? 0), 0);
  const weighed = [...logs].reverse().find((l) => l.avg_weight_g != null && Number(l.avg_weight_g) > 0);
  const latestWeightG = weighed ? Number(weighed.avg_weight_g) : null;
  const liveKg = latestWeightG !== null ? (live * latestWeightG) / 1000 : live === 0 ? 0 : null;
  const producedKg = liveKg !== null ? b.soldKg + liveKg : null;
  const gainKg = producedKg !== null ? producedKg - b.initialCount * CHICK_WEIGHT_KG : null;
  const fcr = gainKg !== null && gainKg > 0 && feedKg > 0 ? feedKg / gainKg : null;
  const ageDays = days(b.placedDate, b.asOf);
  const birdsOut = b.soldBirds + live;
  const avgKg = producedKg !== null && birdsOut > 0 ? producedKg / birdsOut : null;
  const livability = b.initialCount > 0 ? ((b.initialCount - deaths) / b.initialCount) * 100 : 0;
  const epef = fcr !== null && avgKg !== null && ageDays > 0 ? (livability * avgKg * 100) / (ageDays * fcr) : null;
  const chickCost = (b.chickPrice ?? 0) * b.initialCount;
  const totalCost = chickCost + b.feedCost + b.medicineCost;
  return {
    ageDays,
    live,
    deaths,
    mortalityPct: b.initialCount > 0 ? (deaths / b.initialCount) * 100 : 0,
    feedKg,
    latestWeightG,
    latestWeightDate: weighed?.log_date ?? null,
    liveKg,
    producedKg,
    fcr,
    epef,
    chickCost,
    totalCost,
    costPerKg: producedKg && producedKg > 0 ? totalCost / producedKg : null,
    costPerBird: birdsOut > 0 ? totalCost / birdsOut : null,
    salesAmount: b.salesAmount,
    profit: b.salesAmount - totalCost,
  };
}
