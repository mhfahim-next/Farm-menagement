// Cattle weight maths. Pure functions (no I/O) so they are easy to test and reuse.

export type WeightRecord = {
  id: string;
  weigh_date: string; // YYYY-MM-DD
  weight_kg: number;
  method: "scale" | "tape" | "estimate";
  heart_girth_cm: number | null;
  body_length_cm: number | null;
  notes: string | null;
};

/**
 * Live weight from a measuring tape (Schaeffer's formula, metric):
 * kg = heart girth (cm)² × body length (cm) ÷ 10,838.
 * Accurate to roughly ±5–10 % for adult cattle — good when there is no scale.
 */
export function tapeWeight(heartGirthCm: number, bodyLengthCm: number) {
  if (!(heartGirthCm > 0) || !(bodyLengthCm > 0)) return null;
  return Math.round(((heartGirthCm * heartGirthCm * bodyLengthCm) / 10838) * 10) / 10;
}

const day = (d: string) => Date.parse(d + "T00:00:00Z") / 86_400_000;

export type WeightSummary = {
  current: WeightRecord | null;
  previous: WeightRecord | null;
  /** Change since the previous weighing, kg. */
  change: number | null;
  /** Average daily gain between the previous and the latest weighing, kg/day. */
  adg: number | null;
  /** Gain since the first weighing, kg. */
  totalGain: number | null;
};

export function weightSummary(records: WeightRecord[]): WeightSummary {
  const sorted = [...records].sort((a, b) => a.weigh_date.localeCompare(b.weigh_date));
  const current = sorted.at(-1) ?? null;
  const previous = sorted.length > 1 ? sorted[sorted.length - 2] : null;
  const first = sorted[0] ?? null;
  const change = current && previous ? Number(current.weight_kg) - Number(previous.weight_kg) : null;
  const days = current && previous ? day(current.weigh_date) - day(previous.weigh_date) : 0;
  return {
    current,
    previous,
    change: change === null ? null : Math.round(change * 10) / 10,
    adg: change !== null && days > 0 ? Math.round((change / days) * 1000) / 1000 : null,
    totalGain: current && first && current !== first ? Math.round((Number(current.weight_kg) - Number(first.weight_kg)) * 10) / 10 : null,
  };
}
