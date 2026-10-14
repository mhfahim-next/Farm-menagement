import { addDays, daysBetween } from "./breeding";
import type { HealthRecord, HealthRecordType } from "./types";

export const healthTypeOptions: { value: HealthRecordType; label: string }[] = [
  { value: "vaccination", label: "Vaccination" },
  { value: "parasite_control", label: "Pest control" },
  { value: "deworming", label: "Deworming" },
  { value: "treatment", label: "Treatment" },
  { value: "checkup", label: "Check-up" },
];

/** Common products with a usual repeat interval. Farmers can edit both. */
export const healthPresets: {
  id: string;
  label: string;
  type: HealthRecordType;
  product: string;
  intervalDays: number;
}[] = [
  { id: "fmd", label: "FMD vaccine (every 6 months)", type: "vaccination", product: "FMD", intervalDays: 180 },
  { id: "hs", label: "HS vaccine (yearly)", type: "vaccination", product: "HS (Haemorrhagic Septicaemia)", intervalDays: 365 },
  { id: "bq", label: "BQ vaccine (yearly)", type: "vaccination", product: "BQ (Black Quarter)", intervalDays: 365 },
  { id: "anthrax", label: "Anthrax vaccine (yearly)", type: "vaccination", product: "Anthrax", intervalDays: 365 },
  { id: "lsd", label: "Lumpy skin disease vaccine (yearly)", type: "vaccination", product: "LSD (Lumpy Skin Disease)", intervalDays: 365 },
  { id: "rabies", label: "Rabies vaccine (yearly)", type: "vaccination", product: "Rabies", intervalDays: 365 },
  { id: "brucella", label: "Brucellosis vaccine (once)", type: "vaccination", product: "Brucellosis", intervalDays: 0 },
  { id: "deworm", label: "Deworming (every 3 months)", type: "deworming", product: "Dewormer", intervalDays: 90 },
  { id: "tick-spray", label: "Tick / fly spray (every 3 weeks)", type: "parasite_control", product: "Tick & fly spray", intervalDays: 21 },
  { id: "pour-on", label: "Pour-on / injectable ectoparasiticide (every 2 months)", type: "parasite_control", product: "Ivermectin", intervalDays: 60 },
];

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

export function dueLabel(daysUntilDue: number) {
  if (daysUntilDue < 0) return `${-daysUntilDue} day${daysUntilDue === -1 ? "" : "s"} overdue`;
  if (daysUntilDue === 0) return "Due today";
  if (daysUntilDue === 1) return "Due tomorrow";
  return `Due in ${daysUntilDue} days`;
}
