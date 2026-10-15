import { addDays, daysBetween } from "./breeding";
import type { I18n } from "./i18n/core";
import type { HealthRecord, HealthRecordType } from "./types";

export const trackedTypes: HealthRecordType[] = ["vaccination", "parasite_control", "deworming"];

export type DueItem = {
  record: HealthRecord;
  /** Negative = overdue by that many days. */
  daysUntilDue: number;
  overdue: boolean;
};

/**
 * Looks at the schedule of every animal+product and returns the ones that are
 * overdue or due within `windowDays`. Only the newest record per
 * animal+type+product counts, so renewing a vaccine clears the old reminder.
 */
export function dueItems(records: HealthRecord[], today: string, windowDays = 14): DueItem[] {
  const newest = new Map<string, HealthRecord>();
  for (const r of records) {
    if (!trackedTypes.includes(r.record_type)) continue;
    const key = [r.cattle_id, r.record_type, (r.product ?? r.description).trim().toLowerCase()].join("|");
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

export function nextDue(recordDate: string, intervalDays: number | null) {
  return intervalDays && intervalDays > 0 ? addDays(recordDate, intervalDays) : null;
}

export function dueLabel(t: I18n["t"], daysUntilDue: number) {
  if (daysUntilDue < 0) return t("health.overdueDays", { n: -daysUntilDue });
  if (daysUntilDue === 0) return t("health.dueToday");
  if (daysUntilDue === 1) return t("health.dueTomorrow");
  return t("health.dueIn", { n: daysUntilDue });
}
