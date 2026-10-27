import { addDays, breedingEntry, buyerEntry, calfCategories, healthEntry, isDate, paymentEntry, saleEntry, saleModule, uuid, type BreedingInput, type SaleInput } from "@/lib/records";

const today = "2026-10-27";

test("dates", () => {
  expect(addDays("2026-10-27", 283)).toBe("2027-08-06");
  expect(isDate("2026-02-30")).toBe(false);
  expect(isDate("2026-02-28")).toBe(true);
  expect(isDate("27-10-2026")).toBe(false);
});

test("health: one record per animal, next due from the interval", () => {
  const base = { cattleIds: ["a", "b", "a"], date: "2026-10-20", type: "vaccination", product: " FMD ", interval: "১৮০", cost: "", notes: "" };
  const r = healthEntry(base, today, ["vaccination", "treatment"]);
  expect(r).toEqual({
    ok: true,
    entry: { cattle_ids: ["a", "b"], record_date: "2026-10-20", record_type: "vaccination", product: "FMD", interval_days: 180, next_due_date: "2027-04-18", cost: null, notes: null },
  });
  expect(healthEntry({ ...base, cattleIds: [] }, today, ["vaccination"])).toEqual({ ok: false, error: "rec.err.animals" });
  expect(healthEntry({ ...base, product: " " }, today, ["vaccination"])).toEqual({ ok: false, error: "rec.err.product" });
  expect(healthEntry({ ...base, date: "2026-10-28" }, today, ["vaccination"])).toEqual({ ok: false, error: "rec.err.future" });
  expect(healthEntry({ ...base, interval: "0" }, today, ["vaccination"])).toEqual({ ok: false, error: "rec.err.interval" });
  expect(healthEntry({ ...base, type: "magic" }, today, ["vaccination"])).toEqual({ ok: false, error: "rec.err.type" });
  const noInterval = healthEntry({ ...base, interval: "", cost: "350" }, today, ["vaccination"]);
  expect(noInterval.ok && [noInterval.entry.next_due_date, noInterval.entry.cost]).toEqual([null, 350]);
});

const br = (x: Partial<BreedingInput>): BreedingInput => ({
  cattleId: "c", species: "cattle", type: "insemination", date: "2026-10-20", semen: "HF-123", technician: "", cost: "500",
  heatSigns: [], result: "", notes: "", calfTag: "", calfName: "", calfCategory: "heifer", ...x,
});

test("breeding: expected calving by species, heat → next heat, result required for pregnancy check", () => {
  const ai = breedingEntry(br({}), today, null);
  expect(ai.ok && ai.entry.expected_calving_date).toBe("2027-07-30");
  expect(ai.ok && ai.next).toEqual({ kind: "calving", date: "2027-07-30" });
  const goat = breedingEntry(br({ species: "goat" }), today, { gestation_days: 283, heat_cycle_days: 21, goat_gestation_days: 152, sheep_gestation_days: 147 });
  expect(goat.ok && goat.entry.expected_calving_date).toBe("2027-03-21");
  const heat = breedingEntry(br({ type: "heat", heatSigns: ["standing", "mucus"], semen: "x" }), today, null);
  expect(heat.ok && [heat.entry.heat_signs, heat.entry.bull_or_semen, heat.next]).toEqual(["standing, mucus", null, { kind: "heat", date: "2026-11-10" }]);
  expect(breedingEntry(br({ type: "pregnancy_check" }), today, null)).toEqual({ ok: false, error: "rec.err.result" });
  expect(breedingEntry(br({ cattleId: "" }), today, null)).toEqual({ ok: false, error: "rec.err.animal" });
  const calving = breedingEntry(br({ type: "calving", calfTag: " C-9 ", calfName: "", calfCategory: "bull" }), today, null);
  expect(calving.ok && calving.entry.calf).toEqual({ tag_number: "C-9", name: null, category: "bull" });
  expect(calfCategories("goat")).toEqual(["doeling", "buckling"]);
});

const sale = (x: Partial<SaleInput>): SaleInput => ({
  date: today, product: "milk", unit: "litre", quantity: "20", price: "60", amount: "", paid: "", buyerId: null, animal: null, flock: null, heads: "", notes: "", ...x,
});

test("sales: amount from quantity × price, cash without a buyer, dues with one", () => {
  const cash = saleEntry(sale({}), today);
  expect(cash.ok && [cash.entry.amount, cash.entry.paid_amount, cash.due, cash.entry.module]).toEqual([1200, 1200, 0, "dairy"]);
  const credit = saleEntry(sale({ buyerId: "b", paid: "500" }), today);
  expect(credit.ok && [credit.entry.paid_amount, credit.due]).toEqual([500, 700]);
  const over = saleEntry(sale({ buyerId: "b", paid: "5000" }), today);
  expect(over.ok && over.entry.paid_amount).toBe(1200);
  expect(saleEntry(sale({ quantity: "0" }), today)).toEqual({ ok: false, error: "sale.err.qty" });
  expect(saleEntry(sale({ price: "", amount: "" }), today)).toEqual({ ok: false, error: "sale.err.amount" });
  const cow = saleEntry(sale({ product: "animal", price: "", amount: "85000", animal: { id: "c", species: "cattle", is_fattening: true } }), today);
  expect(cow.ok && [cow.entry.quantity, cow.entry.unit, cow.entry.amount, cow.entry.module, cow.entry.cattle_id]).toEqual([1, "head", 85000, "fattening", "c"]);
  expect(saleEntry(sale({ product: "animal", amount: "1" }), today)).toEqual({ ok: false, error: "sale.err.animal" });
  expect(saleEntry(sale({ product: "birds", unit: "kg", quantity: "100", flock: { id: "f", kind: "broiler" }, heads: "60.5" }), today)).toEqual({ ok: false, error: "sale.err.heads" });
  const eggs = saleEntry(sale({ product: "eggs", unit: "hali", quantity: "50", price: "48", flock: { id: "f", kind: "layer" } }), today);
  expect(eggs.ok && [eggs.entry.amount, eggs.entry.module, eggs.entry.flock_id]).toEqual([2400, "layer", "f"]);
  expect(saleModule("animal", { id: "g", species: "goat", is_fattening: false }, null)).toBe("goat");
  expect(saleModule("manure", null, null)).toBe("general");
});

test("payments and buyers", () => {
  expect(paymentEntry({ buyerId: "b", date: today, amount: "৫০০", method: "bkash", notes: "" }, today)).toEqual({
    ok: true, entry: { buyer_id: "b", pay_date: today, amount: 500, method: "bkash", notes: null },
  });
  expect(paymentEntry({ buyerId: null, date: today, amount: "5", method: "cash", notes: "" }, today)).toEqual({ ok: false, error: "sale.err.buyer" });
  expect(buyerEntry({ id: "x", name: "R", phone: "", milkRate: "", eggRate: "" })).toEqual({ ok: false, error: "sale.err.name" });
  const b = buyerEntry({ id: "x", name: " Rahim Sweets ", phone: "017", milkRate: "65", eggRate: "" });
  expect(b.ok && b.entry).toEqual({ id: "x", name: "Rahim Sweets", phone: "017", milk_rate: 65, egg_rate: null });
});

test("ids look like uuids (v4)", () => {
  const id = uuid();
  expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  expect(uuid()).not.toBe(id);
});
