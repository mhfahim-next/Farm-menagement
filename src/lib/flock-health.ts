import { daysBetween } from "./breeding";
import { trackedTypes } from "./health";
import type { FlockHealthRecord } from "./types";

export type FlockDueItem = { record: FlockHealthRecord; daysUntilDue: number; overdue: boolean };

/**
 * Same idea as the cattle schedule: only the newest record per
 * flock+type+product counts, so repeating a vaccine clears the old reminder.
 */
export function flockDueItems(records: FlockHealthRecord[], today: string, windowDays = 14): FlockDueItem[] {
  const newest = new Map<string, FlockHealthRecord>();
  for (const r of records) {
    if (!trackedTypes.includes(r.record_type)) continue;
    const key = [r.flock_id, r.record_type, r.product.trim().toLowerCase()].join("|");
    const cur = newest.get(key);
    if (!cur || r.record_date > cur.record_date) newest.set(key, r);
  }
  return [...newest.values()]
    .filter((r) => r.next_due_date)
    .map((r) => {
      const daysUntilDue = daysBetween(today, r.next_due_date!);
      return { record: r, daysUntilDue, overdue: daysUntilDue < 0 };
    })
    .filter((d) => d.daysUntilDue <= windowDays)
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue);
}
