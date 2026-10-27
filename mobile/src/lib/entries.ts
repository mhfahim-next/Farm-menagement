// Daily entries checked before saving (pure: no device code, so it can be unit-tested).

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

/** A typed number: Bangla digits and a decimal comma are accepted. Blank → null, unreadable → NaN. */
export function parseNumber(raw: string | undefined | null): number | null {
  const s = (raw ?? "").trim().replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d))).replace(",", ".");
  if (s === "") return null;
  return /^\d*\.?\d+$|^\d+\.$/.test(s) ? Number(s) : NaN;
}

export type MilkRow = { cattle_id: string; quantity_liters: number };
export type MilkEntry = { record_date: string; session: string; rows: MilkRow[] };

/** The milking sheet: litres per cow (blank cows are skipped). */
export function milkEntry(record_date: string, session: string, litres: Record<string, string>):
  | { ok: true; entry: MilkEntry; total: number }
  | { ok: false; error: "entry.err.number" | "entry.err.none" | "entry.err.tooMuch" } {
  const rows: MilkRow[] = [];
  for (const [cattle_id, raw] of Object.entries(litres)) {
    const v = parseNumber(raw);
    if (v === null) continue;
    if (!Number.isFinite(v) || v < 0) return { ok: false, error: "entry.err.number" };
    // One milking of one cow; anything above this is a typing slip.
    if (v > 80) return { ok: false, error: "entry.err.tooMuch" };
    rows.push({ cattle_id, quantity_liters: Math.round(v * 100) / 100 });
  }
  if (!rows.length) return { ok: false, error: "entry.err.none" };
  return { ok: true, entry: { record_date, session, rows }, total: rows.reduce((s, r) => s + r.quantity_liters, 0) };
}

export type FlockEntry = {
  flock_id: string;
  log_date: string;
  eggs_collected: number;
  eggs_broken: number;
  mortality: number;
  culled: number;
  feed_kg: number | null;
  avg_weight_g?: number | null;
  /** The stock feed its kg come off (the server records the use). */
  feed_item_id?: string | null;
};

export type FlockFields = { eggs: string; broken: string; mortality: string; culled: string; feed: string; weight?: string };

/** A flock's day: counts are whole numbers, feed and weight may have decimals. */
export function flockEntry(flock_id: string, log_date: string, f: FlockFields, withWeight: boolean):
  | { ok: true; entry: FlockEntry }
  | { ok: false; error: "entry.err.number" | "entry.err.whole" | "entry.err.none" } {
  const counts = [f.eggs, f.broken, f.mortality, f.culled].map(parseNumber);
  const feed = parseNumber(f.feed);
  const weight = withWeight ? parseNumber(f.weight) : null;
  const all = [...counts, feed, weight];
  if (all.some((v) => v !== null && (!Number.isFinite(v) || v < 0))) return { ok: false, error: "entry.err.number" };
  if (counts.some((v) => v !== null && !Number.isInteger(v))) return { ok: false, error: "entry.err.whole" };
  if (all.every((v) => v === null)) return { ok: false, error: "entry.err.none" };
  const [eggs, broken, mortality, culled] = counts.map((v) => v ?? 0);
  return {
    ok: true,
    entry: {
      flock_id,
      log_date,
      eggs_collected: eggs,
      eggs_broken: broken,
      mortality,
      culled,
      feed_kg: feed,
      ...(withWeight ? { avg_weight_g: weight } : {}),
    },
  };
}

/** True when a save failed because the server could not be reached (not because it said no). */
export function isNetworkError(e: { message?: string; name?: string } | null | undefined) {
  if (!e) return false;
  return /network request failed|failed to fetch|load failed|network ?error|timed? ?out|fetch/i.test(`${e.name ?? ""} ${e.message ?? ""}`);
}
