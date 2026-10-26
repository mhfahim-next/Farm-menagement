import { strict as assert } from "node:assert";
import { test } from "node:test";
import { addDays, DEFAULT_BREEDING_RULES, reproStatus, rulesForSpecies } from "../../src/lib/breeding.ts";
import { parseDate, plainNumber } from "../../src/lib/import.ts";
import { farmModules, keepsAnimals, keepsPoultry, moduleAllowed } from "../../src/lib/modules.ts";
import { monthResults, sectionShares, type MonthSummary } from "../../src/lib/profit.ts";
import { tapeWeight } from "../../src/lib/weights.ts";

test("gestation and heat cycle by species; goats and sheep are not dried off", () => {
  assert.equal(rulesForSpecies(DEFAULT_BREEDING_RULES, "cattle").gestationDays, 283);
  assert.equal(rulesForSpecies(DEFAULT_BREEDING_RULES, "goat").gestationDays, 150);
  const sheep = rulesForSpecies(DEFAULT_BREEDING_RULES, "sheep");
  assert.equal(sheep.gestationDays, 147);
  assert.equal(sheep.heatCycleDays, 17);
  const ai = [{ event_type: "insemination" as const, event_date: "2026-10-01", result: null, expected_calving_date: null }];
  // Inseminated: back in heat by one cycle if she did not hold (17 days for sheep).
  assert.equal(reproStatus(ai, "2026-10-02", sheep).returnToHeatBy, addDays("2026-10-01", 17));
  // Confirmed pregnant: birth after the species' gestation, no dry-off for goats.
  const pregnant = [...ai, { event_type: "pregnancy_check" as const, event_date: "2026-11-05", result: "positive", expected_calving_date: null }];
  const goat = reproStatus(pregnant, "2026-11-06", rulesForSpecies(DEFAULT_BREEDING_RULES, "goat"));
  assert.equal(goat.expectedCalving, addDays("2026-10-01", 150));
  assert.equal(goat.dryOffDue, null);
  const cow = reproStatus(pregnant, "2026-11-06");
  assert.equal(cow.expectedCalving, addDays("2026-10-01", 283));
  assert.equal(cow.dryOffDue, addDays("2026-10-01", 283 - 60));
});

test("farm kinds decide pages and money sections", () => {
  const f = { has_dairy: false, has_layer: false, has_goat: true, has_broiler: true };
  assert.equal(keepsAnimals(f), true);
  assert.equal(keepsPoultry(f), true);
  assert.deepEqual(farmModules(f), ["goat", "broiler", "general"]);
  assert.equal(moduleAllowed(f, "dairy"), false);
  assert.equal(moduleAllowed({ has_dairy: true, has_layer: true }, "fattening"), false);
});

const month = (o: Partial<MonthSummary>): MonthSummary => ({
  month: "2026-10-01", milk_litres: 1000, eggs_collected: 10000, eggs_broken: 0, layer_feed_kg: 0,
  dairy_income: 0, dairy_expense: 0, layer_income: 0, layer_expense: 0, general_income: 0, general_expense: 0,
  dairy_feed_expense: 0, layer_feed_expense: 0, milk_sold_litres: 0, milk_sales_amount: 0, eggs_sold: 0, egg_sales_amount: 0,
  other_expense: 0, ...o,
});

test("shared costs are split by each section's own costs, including fattening/goats/broilers", () => {
  const s = month({ dairy_expense: 20000, layer_expense: 20000, other_expense: 40000, general_expense: 8000 });
  assert.deepEqual(sectionShares(s, true, true, true), { dairy: 0.25, layer: 0.25 });
  assert.deepEqual(sectionShares(s, true, true, false), { dairy: 0.5, layer: 0.5 });
  const r = monthResults(s, true, true, true);
  assert.equal(r.dairy.cost, 22000);
  assert.equal(r.dairy.costPerUnit, 22);
  assert.deepEqual(sectionShares(month({}), true, false, true), { dairy: 0.5, layer: 0 });
});

test("import: Bangladeshi dates and numbers", () => {
  assert.equal(parseDate("05/10/2026"), "2026-10-05");
  assert.equal(parseDate("২০২৬-১০-০৫"), "2026-10-05");
  assert.equal(parseDate("45935"), "2025-10-05");
  assert.equal(parseDate("31/02/2026"), null);
  assert.equal(plainNumber("৳১,২৫০"), "1250");
  assert.equal(plainNumber("6,5"), "6.5");
});

test("tape weight (Schaeffer)", () => {
  assert.equal(tapeWeight(180, 150), Math.round(((180 * 180 * 150) / 10838) * 10) / 10);
  assert.equal(tapeWeight(0, 150), null);
});
