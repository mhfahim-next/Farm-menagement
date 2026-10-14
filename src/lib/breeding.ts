// Reproduction status of a cow, derived from her breeding events.
// Pure functions (no I/O) so the rules are easy to test and to reuse in a
// mobile app.

export const HEAT_CYCLE_DAYS = 21;
export const GESTATION_DAYS = 283;
/** When to check an inseminated cow for pregnancy. */
export const PREGNANCY_CHECK_AFTER_DAYS = 45;
/** Dry cows off this many days before calving. */
export const DRY_OFF_BEFORE_CALVING_DAYS = 60;
/** Cow still not bred this long after calving → flag for service. */
export const VOLUNTARY_WAIT_DAYS = 60;

/** Heat signs the form offers. Stored as these slugs; shown via `sign.<slug>`. */
export const HEAT_SIGNS = ["standing", "mounting", "mucus", "restless", "swollen", "milk_drop"] as const;

/**
 * Turns the stored "standing, mucus" into translated text. Older free-text
 * values (saved before signs became a fixed list) are shown as they are.
 */
export function heatSignsText(
  t: (key: `sign.${(typeof HEAT_SIGNS)[number]}`) => string,
  raw: string | null,
) {
  if (!raw) return null;
  return raw
    .split(",")
    .map((part) => part.trim())
    .map((part) =>
      (HEAT_SIGNS as readonly string[]).includes(part)
        ? t(`sign.${part as (typeof HEAT_SIGNS)[number]}`)
        : part,
    )
    .join(", ");
}

export type BreedingEventLite = {
  event_type: "heat" | "insemination" | "pregnancy_check" | "calving" | "dry_off";
  event_date: string; // YYYY-MM-DD
  result: string | null;
  expected_calving_date: string | null;
  created_at?: string;
};

export type ReproState = "pregnant" | "inseminated" | "open";

export type ReproStatus = {
  state: ReproState;
  lastCalving: string | null;
  lastHeat: string | null;
  lastInsemination: string | null;
  inseminationCount: number; // services since last calving
  /** Open cows: when the next heat is expected (21 days after the last heat). */
  nextHeatExpected: string | null;
  /** Inseminated cows: when to check for pregnancy. */
  pregnancyCheckDue: string | null;
  /** Inseminated cows: if no heat is seen, the date she should have returned. */
  returnToHeatBy: string | null;
  expectedCalving: string | null;
  dryOffDue: string | null;
  /** Open cow, calved long ago, never served. */
  serviceOverdue: boolean;
  daysOpen: number | null;
};

export function addDays(date: string, days: number) {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string) {
  return Math.round(
    (Date.parse(to + "T00:00:00Z") - Date.parse(from + "T00:00:00Z")) / 86_400_000,
  );
}

const isPositive = (r: string | null) => r?.trim().toLowerCase() === "positive";

export function reproStatus(events: BreedingEventLite[], today: string): ReproStatus {
  // Oldest → newest; ties broken by insertion time so same-day events keep order.
  const sorted = [...events].sort(
    (a, b) =>
      a.event_date.localeCompare(b.event_date) ||
      (a.created_at ?? "").localeCompare(b.created_at ?? ""),
  );
  const last = (type: BreedingEventLite["event_type"]) =>
    [...sorted].reverse().find((e) => e.event_type === type) ?? null;

  const calving = last("calving");
  const lastCalvingDate = calving?.event_date ?? null;
  // Only look at what happened since the last calving; earlier cycles are over.
  const cycle = sorted.filter((e) => !lastCalvingDate || e.event_date >= lastCalvingDate);

  const inseminations = cycle.filter((e) => e.event_type === "insemination");
  const lastInsem = inseminations.at(-1) ?? null;
  const heats = cycle.filter((e) => e.event_type === "heat");
  const lastHeat = heats.at(-1) ?? null;

  let state: ReproState = "open";
  let expectedCalving: string | null = null;
  let pregnancyCheckDue: string | null = null;
  let returnToHeatBy: string | null = null;

  if (lastInsem) {
    const after = (e: BreedingEventLite) =>
      e.event_date > lastInsem.event_date ||
      (e.event_date === lastInsem.event_date && e.event_type !== "insemination");
    const checks = cycle.filter((e) => e.event_type === "pregnancy_check" && after(e));
    const lastCheck = checks.at(-1) ?? null;
    // A heat seen after the insemination means she did not hold.
    const heatAfter = heats.some((h) => h.event_date > lastInsem.event_date);

    if (lastCheck && isPositive(lastCheck.result)) {
      state = "pregnant";
      expectedCalving = lastInsem.expected_calving_date ?? addDays(lastInsem.event_date, GESTATION_DAYS);
    } else if (!lastCheck && !heatAfter) {
      state = "inseminated";
      pregnancyCheckDue = addDays(lastInsem.event_date, PREGNANCY_CHECK_AFTER_DAYS);
      returnToHeatBy = addDays(lastInsem.event_date, HEAT_CYCLE_DAYS);
    }
  }

  // Heat/insemination that is superseded by a later outcome no longer counts.
  const lastHeatDate = lastHeat?.event_date ?? null;
  const nextHeatExpected =
    state === "open"
      ? lastHeatDate
        ? addDays(lastHeatDate, HEAT_CYCLE_DAYS)
        : null
      : null;

  const daysSinceCalving = lastCalvingDate ? daysBetween(lastCalvingDate, today) : null;
  const serviceOverdue =
    state === "open" &&
    lastCalvingDate !== null &&
    inseminations.length === 0 &&
    daysSinceCalving !== null &&
    daysSinceCalving > VOLUNTARY_WAIT_DAYS;

  const dryOffDue = expectedCalving ? addDays(expectedCalving, -DRY_OFF_BEFORE_CALVING_DAYS) : null;

  return {
    state,
    lastCalving: lastCalvingDate,
    lastHeat: lastHeatDate,
    lastInsemination: lastInsem?.event_date ?? null,
    inseminationCount: inseminations.length,
    nextHeatExpected,
    pregnancyCheckDue,
    returnToHeatBy,
    expectedCalving,
    dryOffDue,
    serviceOverdue,
    daysOpen:
      state === "open" && lastCalvingDate !== null ? daysSinceCalving : null,
  };
}

// ---------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------

export type BreedingAlertKind =
  | "heat_expected"
  | "return_to_heat"
  | "pregnancy_check"
  | "dry_off"
  | "calving_soon"
  | "service_overdue";

export type BreedingAlert = {
  kind: BreedingAlertKind;
  /** The date the alert is about (null for service_overdue). */
  date: string | null;
  /** Negative = already past. */
  daysUntil: number;
};

/** Days either side of the predicted heat date when we tell the farmer to watch. */
const HEAT_WINDOW_DAYS = 3;

export function breedingAlerts(status: ReproStatus, today: string): BreedingAlert[] {
  const alerts: BreedingAlert[] = [];
  const until = (d: string) => daysBetween(today, d);

  if (status.state === "open" && status.nextHeatExpected) {
    const n = until(status.nextHeatExpected);
    if (n >= -HEAT_WINDOW_DAYS && n <= HEAT_WINDOW_DAYS) {
      alerts.push({ kind: "heat_expected", date: status.nextHeatExpected, daysUntil: n });
    }
  }
  if (status.state === "inseminated") {
    if (status.returnToHeatBy) {
      const n = until(status.returnToHeatBy);
      if (n >= -HEAT_WINDOW_DAYS && n <= HEAT_WINDOW_DAYS) {
        alerts.push({ kind: "return_to_heat", date: status.returnToHeatBy, daysUntil: n });
      }
    }
    if (status.pregnancyCheckDue) {
      const n = until(status.pregnancyCheckDue);
      if (n <= 7) alerts.push({ kind: "pregnancy_check", date: status.pregnancyCheckDue, daysUntil: n });
    }
  }
  if (status.state === "pregnant") {
    if (status.dryOffDue) {
      const n = until(status.dryOffDue);
      if (n <= 7) alerts.push({ kind: "dry_off", date: status.dryOffDue, daysUntil: n });
    }
    if (status.expectedCalving) {
      const n = until(status.expectedCalving);
      if (n <= 21) alerts.push({ kind: "calving_soon", date: status.expectedCalving, daysUntil: n });
    }
  }
  if (status.serviceOverdue) alerts.push({ kind: "service_overdue", date: null, daysUntil: 0 });

  return alerts;
}
