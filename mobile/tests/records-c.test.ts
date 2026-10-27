import { breedingFields, healthFields, overdueCount, type BreedingEntry } from "../src/lib/records";

test("a doctor's health entry becomes the website's form fields", () => {
  const e = { cattle_ids: ["a", "b"], record_date: "2026-10-27", record_type: "vaccination", product: "FMD", interval_days: 180, next_due_date: "2027-04-25", cost: 300, notes: null };
  expect(healthFields(e)).toEqual([
    ["cattle_id", "a"],
    ["cattle_id", "b"],
    ["record_type", "vaccination"],
    ["product", "FMD"],
    ["record_date", "2026-10-27"],
    ["interval_days", "180"],
    ["cost", "300"],
  ]);
  expect(healthFields(e, "rec-1")[0]).toEqual(["id", "rec-1"]);
});

test("a doctor's breeding entry becomes the website's form fields", () => {
  const e: BreedingEntry = {
    cattle_id: "c",
    event_type: "heat",
    event_date: "2026-10-27",
    bull_or_semen: null,
    technician: null,
    cost: null,
    heat_signs: "mounting, mucus",
    result: null,
    expected_calving_date: null,
    notes: null,
    calf: null,
  };
  expect(breedingFields(e)).toEqual([
    ["cattle_id", "c"],
    ["event_type", "heat"],
    ["event_date", "2026-10-27"],
    ["heat_sign", "mounting"],
    ["heat_sign", "mucus"],
  ]);
  const calving: BreedingEntry = { ...e, event_type: "calving", heat_signs: null, calf: { tag_number: "C-9", name: null, category: "heifer" } };
  expect(breedingFields(calving)).toContainEqual(["calf_tag", "C-9"]);
  expect(breedingFields(calving, "ev-1").slice(0, 2)).toEqual([["id", "ev-1"], ["event_date", "2026-10-27"]]);
});

test("overdue counts only the newest record and active animals", () => {
  const r = (cattle_id: string, record_date: string, next_due_date: string | null, product = "FMD", record_type = "vaccination") => ({ cattle_id, record_type, product, description: null, record_date, next_due_date });
  const rows = [
    r("a", "2026-01-01", "2026-07-01"), // renewed below: not overdue
    r("a", "2026-07-02", "2027-01-01"),
    r("b", "2026-01-01", "2026-07-01"), // overdue
    r("c", "2026-01-01", "2026-07-01"), // animal sold
    r("b", "2026-01-01", "2026-02-01", "Mastitis", "treatment"), // not tracked
  ];
  expect(overdueCount(rows, new Set(["a", "b"]), "2026-10-27")).toBe(1);
});
