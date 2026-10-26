import { strict as assert } from "node:assert";
import { test } from "node:test";
import { buildReminders, forPerson, forSlot, reminderText, type ReminderInput } from "../../src/lib/reminders.ts";

const empty: ReminderInput = {
  today: "2026-10-26",
  hour: 9,
  currency: "BDT",
  health: [],
  flockHealth: [],
  breeding: [],
  lowStock: [],
  dues: { buyers: 0, total: 0 },
  milkEnteredToday: null,
  eggsEnteredToday: null,
  batches: [],
  fattening: null,
  plan: null,
};
const kinds = (x: Partial<ReminderInput>) => buildReminders({ ...empty, ...x }).map((r) => r.kind);

test("reminders: vaccines only within three days, overdue first and red", () => {
  const list = buildReminders({
    ...empty,
    health: [
      { id: "a", animalId: "c1", animal: "C-1", product: "FMD", days: 2 },
      { id: "b", animalId: "c2", animal: "C-2", product: "LSD", days: -4 },
      { id: "c", animalId: "c3", animal: "C-3", product: "Worm", days: 10 },
    ],
  });
  assert.deepEqual(list.map((r) => r.params.product), ["LSD", "FMD"]);
  assert.equal(list[0].tone, "red");
  assert.equal(list[0].key, "vaccine:b:2026-10-22");
  assert.equal(list[0].href, "/dashboard/cattle/c2");
});

test("reminders: missing milk / eggs only in the evening, only for farms that record them", () => {
  assert.deepEqual(kinds({ milkEnteredToday: false, eggsEnteredToday: false }), []);
  assert.deepEqual(kinds({ hour: 19, milkEnteredToday: false, eggsEnteredToday: true }), ["milk_missing"]);
  assert.deepEqual(kinds({ hour: 19, milkEnteredToday: null, eggsEnteredToday: false }), ["eggs_missing"]);
});

test("reminders: broiler weighing every 7 days and sale age", () => {
  const batch = { id: "f1", name: "Shed A", kind: "broiler", live: 950 };
  assert.deepEqual(kinds({ batches: [{ ...batch, ageDays: 5, lastWeighed: null }] }), []);
  assert.deepEqual(kinds({ batches: [{ ...batch, ageDays: 14, lastWeighed: "2026-10-22" }] }), []);
  assert.deepEqual(kinds({ batches: [{ ...batch, ageDays: 14, lastWeighed: "2026-10-18" }] }), ["broiler_weigh"]);
  assert.deepEqual(kinds({ batches: [{ ...batch, ageDays: 33, lastWeighed: "2026-10-25" }] }), ["broiler_sale"]);
  assert.deepEqual(kinds({ batches: [{ ...batch, kind: "sonali", ageDays: 33, lastWeighed: "2026-10-25" }] }), []);
  assert.deepEqual(kinds({ batches: [{ ...batch, live: 0, ageDays: 40, lastWeighed: null }] }), []);
});

test("reminders: Qurbani countdown on milestones and the last two weeks", () => {
  const fat = (targetDate: string) => kinds({ fattening: { count: 5, targetDate, isQurbani: true, unweighed: 0 } });
  assert.deepEqual(fat("2026-12-25"), ["fatten_countdown"]); // 60 days
  assert.deepEqual(fat("2026-12-24"), []); // 59 days
  assert.deepEqual(fat("2026-11-05"), ["fatten_countdown"]); // 10 days
  assert.deepEqual(fat("2026-10-20"), []); // passed
  assert.deepEqual(kinds({ fattening: { count: 0, targetDate: "2026-11-05", isQurbani: true, unweighed: 0 } }), []);
});

test("reminders: plan ending within a week, low stock, dues", () => {
  assert.deepEqual(kinds({ plan: { name: "pro", expiresAt: "2026-11-10T00:00:00Z" } }), []);
  const p = buildReminders({ ...empty, plan: { name: "pro", expiresAt: "2026-10-27T10:00:00Z" } });
  assert.equal(p[0].kind, "plan_expiry");
  assert.equal(p[0].tone, "red");
  assert.deepEqual(kinds({ lowStock: [{ id: "i", name: "Feed", onHand: 3, unit: "kg" }], dues: { buyers: 2, total: 1500 } }), ["low_stock", "buyer_due"]);
});

test("reminders: who sees what, muted groups, ticked off", () => {
  const all = buildReminders({
    ...empty,
    hour: 19,
    health: [{ id: "a", animalId: "c1", animal: "C-1", product: "FMD", days: 0 }],
    breeding: [{ animalId: "c1", animal: "C-1", kind: "heat_expected", date: "2026-10-27", days: 1 }],
    lowStock: [{ id: "i", name: "Feed", onHand: 0, unit: "kg" }],
    milkEnteredToday: false,
    plan: { name: "pro", expiresAt: "2026-10-28" },
  });
  const of = (l: typeof all) => l.map((r) => r.kind).sort();
  assert.deepEqual(of(forPerson(all, { role: "owner" })), ["breeding", "low_stock", "milk_missing", "plan_expiry", "vaccine"]);
  assert.deepEqual(of(forPerson(all, { role: "manager" })), ["breeding", "low_stock", "milk_missing", "vaccine"]);
  assert.deepEqual(of(forPerson(all, { role: "worker" })), ["milk_missing", "vaccine"]);
  assert.deepEqual(of(forPerson(all, { role: "vet" })), ["breeding", "vaccine"]);
  assert.deepEqual(of(forPerson(all, { role: "owner", muted: ["health", "stock", "nonsense"] })), ["breeding", "milk_missing", "plan_expiry"]);
  const vaccineKey = all.find((r) => r.kind === "vaccine")!.key;
  assert.deepEqual(of(forPerson(all, { role: "vet", done: new Set([vaccineKey]) })), ["breeding"]);
});

test("reminders: morning has the day's work (dues on Saturday), evening only missing entries", () => {
  const all = buildReminders({ ...empty, hour: 20, milkEnteredToday: false, dues: { buyers: 1, total: 500 }, lowStock: [{ id: "i", name: "Feed", onHand: 1, unit: "kg" }] });
  assert.deepEqual(forSlot(all, "evening", 1).map((r) => r.kind), ["milk_missing"]);
  assert.deepEqual(forSlot(all, "morning", 1).map((r) => r.kind), ["low_stock"]);
  assert.deepEqual(forSlot(all, "morning", 6).map((r) => r.kind).sort(), ["buyer_due", "low_stock"]);
});

test("reminders: text in the reader's words", () => {
  const t = (k: string, v?: Record<string, string | number>) => `${k}${v ? JSON.stringify(v) : ""}`;
  const f = { number: (n: number) => String(n), money: (n: number, c: string) => `${c} ${n}` };
  const e = (v: string | null | undefined) => `E(${v})`;
  const i = { t, f, e } as unknown as Parameters<typeof reminderText>[1];
  const [v] = buildReminders({ ...empty, health: [{ id: "a", animalId: "c1", animal: "C-1", product: "FMD", days: -2 }] });
  assert.deepEqual(reminderText(v, i), { title: 'rem.vaccine{"product":"FMD","animal":"C-1"}', when: 'rem.overdue{"n":2}' });
  const [p] = buildReminders({ ...empty, plan: { name: "pro", expiresAt: "2026-10-26" } });
  assert.equal(reminderText(p, i).title, 'rem.planExpiry{"plan":"E(pro)"}');
  assert.equal(reminderText(p, i).when, "rem.today");
});
