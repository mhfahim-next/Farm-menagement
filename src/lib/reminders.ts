// Reminders: what needs doing on the farm, worked out from its own records.
// Used by the bell in the app, the morning / evening phone notifications and
// the email summary. Pure functions (no I/O) so the rules are easy to check.
import type { BreedingAlertKind } from "./breeding";
import type { I18n } from "./i18n/core";
import type { Role } from "./types";

export const REMINDER_KINDS = [
  "vaccine",
  "flock_vaccine",
  "breeding",
  "low_stock",
  "buyer_due",
  "milk_missing",
  "eggs_missing",
  "broiler_weigh",
  "broiler_sale",
  "fatten_countdown",
  "fatten_weigh",
  "plan_expiry",
] as const;
export type ReminderKind = (typeof REMINDER_KINDS)[number];

/** Groups a person can turn off in their settings. */
export const REMINDER_GROUPS = {
  health: ["vaccine", "flock_vaccine"],
  breeding: ["breeding"],
  entries: ["milk_missing", "eggs_missing"],
  stock: ["low_stock"],
  dues: ["buyer_due"],
  broiler: ["broiler_weigh", "broiler_sale"],
  fattening: ["fatten_countdown", "fatten_weigh"],
  plan: ["plan_expiry"],
} as const satisfies Record<string, readonly ReminderKind[]>;
export type ReminderGroup = keyof typeof REMINDER_GROUPS;
export const isReminderGroup = (v: unknown): v is ReminderGroup => typeof v === "string" && v in REMINDER_GROUPS;

/** Who gets which reminders: owners and managers everything, workers daily work, vets health and breeding. */
const ROLE_KINDS: Record<Role, readonly ReminderKind[] | "all"> = {
  owner: "all",
  manager: "all",
  worker: ["vaccine", "flock_vaccine", "milk_missing", "eggs_missing", "broiler_weigh", "fatten_weigh"],
  vet: ["vaccine", "flock_vaccine", "breeding"],
};
export function kindsForRole(role: Role): readonly ReminderKind[] {
  const k = ROLE_KINDS[role];
  return k === "all" ? (role === "owner" ? REMINDER_KINDS : REMINDER_KINDS.filter((x) => x !== "plan_expiry")) : k;
}

export type Reminder = {
  kind: ReminderKind;
  /** Stable id: kind, the thing it is about and its date. Ticking "done" stores this. */
  key: string;
  href: string;
  /** Negative = overdue by that many days; 0 = today. */
  days: number;
  tone: "red" | "amber" | "blue";
  /** Words for the message (names, counts, dates). */
  params: Record<string, string | number>;
  /** Breeding: which alert. */
  sub?: BreedingAlertKind;
};

/** Evening reminders about today's entries only appear from this hour (farm time). */
export const EVENING_HOUR = 18;
/** Vaccines and medicine show this many days ahead. */
export const HEALTH_AHEAD_DAYS = 3;
/** Broiler / Sonali batches should be sample-weighed this often. */
export const WEIGH_EVERY_DAYS = 7;
/** Fattening animals should be weighed (or taped) at least this often. */
export const FATTEN_WEIGH_EVERY_DAYS = 30;
/** Age (days) from which a batch is usually sold. */
export const SALE_AGE: Record<string, number> = { broiler: 32, sonali: 60 };
/** Countdown to the sale day shows on these days, and every day in the last two weeks. */
const COUNTDOWN_MILESTONES = [60, 45, 30, 21];

export type ReminderInput = {
  today: string;
  /** Hour of the day on the farm (0–23). */
  hour: number;
  currency: string;
  health: { id: string; animalId: string; animal: string; product: string; days: number }[];
  flockHealth: { id: string; flockId: string; flock: string; product: string; days: number }[];
  breeding: { animalId: string; animal: string; kind: BreedingAlertKind; date: string | null; days: number }[];
  lowStock: { id: string; name: string; onHand: number; unit: string }[];
  dues: { buyers: number; total: number };
  /** null = the farm does not keep this. */
  milkEnteredToday: boolean | null;
  eggsEnteredToday: boolean | null;
  batches: { id: string; name: string; kind: string; ageDays: number; live: number; lastWeighed: string | null }[];
  fattening: { count: number; targetDate: string | null; isQurbani: boolean; unweighed: number } | null;
  plan: { name: string; expiresAt: string | null } | null;
};

const dayDiff = (from: string, to: string) => Math.round((Date.parse(to.slice(0, 10)) - Date.parse(from.slice(0, 10))) / 86_400_000);

/** Everything due for this farm right now, most urgent first. */
export function buildReminders(x: ReminderInput): Reminder[] {
  const out: Reminder[] = [];

  for (const h of x.health) {
    if (h.days > HEALTH_AHEAD_DAYS) continue;
    out.push({
      kind: "vaccine",
      key: `vaccine:${h.id}:${dateIn(x.today, h.days)}`,
      href: `/dashboard/cattle/${h.animalId}`,
      days: h.days,
      tone: h.days < 0 ? "red" : "amber",
      params: { animal: h.animal, product: h.product },
    });
  }
  for (const h of x.flockHealth) {
    if (h.days > HEALTH_AHEAD_DAYS) continue;
    out.push({
      kind: "flock_vaccine",
      key: `flock_vaccine:${h.id}:${dateIn(x.today, h.days)}`,
      href: `/dashboard/flocks/${h.flockId}`,
      days: h.days,
      tone: h.days < 0 ? "red" : "amber",
      params: { flock: h.flock, product: h.product },
    });
  }
  for (const b of x.breeding) {
    out.push({
      kind: "breeding",
      sub: b.kind,
      key: `breeding:${b.animalId}:${b.kind}:${b.date ?? "x"}`,
      href: `/dashboard/cattle/${b.animalId}`,
      days: b.days,
      tone: b.kind === "service_overdue" || b.days < 0 ? "red" : b.kind === "heat_expected" || b.kind === "return_to_heat" ? "amber" : "blue",
      params: { animal: b.animal },
    });
  }
  for (const s of x.lowStock) {
    out.push({
      kind: "low_stock",
      key: `low_stock:${s.id}:${x.today}`,
      href: `/dashboard/inventory/${s.id}`,
      days: 0,
      tone: s.onHand <= 0 ? "red" : "amber",
      params: { item: s.name, left: s.onHand, unit: s.unit },
    });
  }
  if (x.dues.total > 0) {
    out.push({
      kind: "buyer_due",
      key: `buyer_due:${x.today}`,
      href: "/dashboard/sales",
      days: 0,
      tone: "blue",
      params: { n: x.dues.buyers, total: x.dues.total, currency: x.currency },
    });
  }
  if (x.hour >= EVENING_HOUR && x.milkEnteredToday === false) {
    out.push({ kind: "milk_missing", key: `milk_missing:${x.today}`, href: "/dashboard/quick", days: 0, tone: "amber", params: {} });
  }
  if (x.hour >= EVENING_HOUR && x.eggsEnteredToday === false) {
    out.push({ kind: "eggs_missing", key: `eggs_missing:${x.today}`, href: "/dashboard/quick", days: 0, tone: "amber", params: {} });
  }
  for (const b of x.batches) {
    if (b.live <= 0) continue;
    const since = b.lastWeighed ? dayDiff(b.lastWeighed, x.today) : null;
    if (b.ageDays >= WEIGH_EVERY_DAYS && (since === null || since >= WEIGH_EVERY_DAYS)) {
      out.push({
        kind: "broiler_weigh",
        key: `broiler_weigh:${b.id}:${x.today}`,
        href: `/dashboard/flocks/${b.id}`,
        days: 0,
        tone: "blue",
        params: { flock: b.name, age: b.ageDays },
      });
    }
    const saleAge = SALE_AGE[b.kind];
    if (saleAge && b.ageDays >= saleAge) {
      out.push({
        kind: "broiler_sale",
        key: `broiler_sale:${b.id}:${x.today}`,
        href: `/dashboard/flocks/${b.id}`,
        days: 0,
        tone: b.ageDays >= saleAge + 10 ? "red" : "amber",
        params: { flock: b.name, age: b.ageDays, live: b.live },
      });
    }
  }
  if (x.fattening && x.fattening.count > 0) {
    const fat = x.fattening;
    if (fat.targetDate) {
      const left = dayDiff(x.today, fat.targetDate);
      if (left >= 0 && (left <= 14 || COUNTDOWN_MILESTONES.includes(left))) {
        out.push({
          kind: "fatten_countdown",
          key: `fatten_countdown:${fat.targetDate}:${left}`,
          href: "/dashboard/fattening",
          days: left,
          tone: left <= 7 ? "amber" : "blue",
          params: { n: left, animals: fat.count, qurbani: fat.isQurbani ? 1 : 0 },
        });
      }
    }
    if (fat.unweighed > 0) {
      out.push({
        kind: "fatten_weigh",
        key: `fatten_weigh:${x.today.slice(0, 7)}`,
        href: "/dashboard/fattening",
        days: 0,
        tone: "blue",
        params: { n: fat.unweighed },
      });
    }
  }
  if (x.plan?.expiresAt) {
    const left = dayDiff(x.today, x.plan.expiresAt);
    if (left <= 7 && left >= -30) {
      out.push({
        kind: "plan_expiry",
        key: `plan_expiry:${x.plan.expiresAt.slice(0, 10)}`,
        href: "/dashboard/plan/pay",
        days: left,
        tone: left <= 1 ? "red" : "amber",
        params: { plan: x.plan.name, n: Math.max(0, left) },
      });
    }
  }

  return out.sort((a, b) => a.days - b.days || (a.tone === "red" ? -1 : 0) - (b.tone === "red" ? -1 : 0));
}

function dateIn(today: string, days: number) {
  return new Date(Date.parse(today) + days * 86_400_000).toISOString().slice(0, 10);
}

/** What one person should see: their role's kinds, minus muted groups and ticked-off ones. */
export function forPerson(all: Reminder[], p: { role: Role; muted?: readonly string[]; done?: ReadonlySet<string> }) {
  const allowed = new Set<ReminderKind>(kindsForRole(p.role));
  const muted = new Set<ReminderKind>((p.muted ?? []).filter(isReminderGroup).flatMap((g) => REMINDER_GROUPS[g]));
  return all.filter((r) => allowed.has(r.kind) && !muted.has(r.kind) && !p.done?.has(r.key));
}

export type Slot = "morning" | "evening";
/** Dues are only sent on this weekday (0 = Sunday … 6 = Saturday, the first day of the week in Bangladesh). */
export const DUES_WEEKDAY = 6;

/**
 * Which reminders go into a scheduled notification. Morning: the day's work
 * (dues once a week). Evening: only "today's milk / eggs not entered".
 */
export function forSlot(list: Reminder[], slot: Slot, weekday: number) {
  if (slot === "evening") return list.filter((r) => r.kind === "milk_missing" || r.kind === "eggs_missing");
  return list.filter((r) => r.kind !== "milk_missing" && r.kind !== "eggs_missing" && (r.kind !== "buyer_due" || weekday === DUES_WEEKDAY));
}

/** The reminder in words, in the reader's language. */
export function reminderText(r: Reminder, i: Pick<I18n, "t" | "f" | "e">) {
  const { t, f, e } = i;
  const when = (days: number) =>
    days < 0 ? t("rem.overdue", { n: -days }) : days === 0 ? t("rem.today") : days === 1 ? t("rem.tomorrow") : t("rem.inDays", { n: days });
  const p = r.params;
  switch (r.kind) {
    case "vaccine":
      return { title: t("rem.vaccine", { product: String(p.product), animal: String(p.animal) }), when: when(r.days) };
    case "flock_vaccine":
      return { title: t("rem.flockVaccine", { product: String(p.product), flock: String(p.flock) }), when: when(r.days) };
    case "breeding":
      return { title: t(`rem.breeding.${r.sub ?? "heat_expected"}`, { animal: String(p.animal) }), when: r.sub === "service_overdue" ? t("rem.review") : when(r.days) };
    case "low_stock":
      return { title: t("rem.lowStock", { item: String(p.item), left: `${f.number(Number(p.left))} ${p.unit}` }), when: t("rem.buySoon") };
    case "buyer_due":
      return { title: t("rem.buyerDue", { n: Number(p.n), total: f.money(Number(p.total), String(p.currency)) }), when: t("rem.collect") };
    case "milk_missing":
      return { title: t("rem.milkMissing"), when: t("rem.today") };
    case "eggs_missing":
      return { title: t("rem.eggsMissing"), when: t("rem.today") };
    case "broiler_weigh":
      return { title: t("rem.broilerWeigh", { flock: String(p.flock), age: f.number(Number(p.age)) }), when: t("rem.today") };
    case "broiler_sale":
      return { title: t("rem.broilerSale", { flock: String(p.flock), age: f.number(Number(p.age)), live: f.number(Number(p.live)) }), when: t("rem.planSale") };
    case "fatten_countdown":
      return {
        title: t(p.qurbani ? "rem.qurbaniCountdown" : "rem.saleCountdown", { n: Number(p.n), animals: f.number(Number(p.animals)) }),
        when: r.days === 0 ? t("rem.today") : t("rem.inDays", { n: r.days }),
      };
    case "fatten_weigh":
      return { title: t("rem.fattenWeigh", { n: Number(p.n) }), when: t("rem.thisWeek") };
    case "plan_expiry":
      return { title: t("rem.planExpiry", { plan: e(String(p.plan)) }), when: r.days < 0 ? t("rem.expired") : when(r.days) };
  }
}

/** Short summary for a phone notification: "3 vaccines, 1 heat, 2 low stock". */
export function summaryCounts(list: Reminder[]) {
  const counts = new Map<ReminderKind, number>();
  for (const r of list) counts.set(r.kind, (counts.get(r.kind) ?? 0) + 1);
  return [...counts.entries()];
}
