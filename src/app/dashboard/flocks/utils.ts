import { today } from "@/lib/format";
import type { Flock, FlockDailyLog } from "@/lib/types";

export function flockAgeWeeks(flock: Pick<Flock, "placed_date" | "age_at_placement_weeks">, on = today()) {
  const days = (Date.parse(on) - Date.parse(flock.placed_date)) / 86_400_000;
  return flock.age_at_placement_weeks + Math.max(0, Math.floor(days / 7));
}

/**
 * Walks logs in date order to know the live bird count at the start of each
 * day, which hen-day % and feed per bird are based on.
 */
export function withDailyStats(initialCount: number, logs: FlockDailyLog[]) {
  let alive = initialCount;
  const rows = logs.map((l) => {
    const birds = alive;
    alive -= l.mortality + l.culled;
    return {
      ...l,
      birds,
      henDay: birds > 0 ? (l.eggs_collected / birds) * 100 : 0,
      feedPerBird: l.feed_kg != null && birds > 0 ? (Number(l.feed_kg) * 1000) / birds : null,
    };
  });
  return { rows, alive };
}
