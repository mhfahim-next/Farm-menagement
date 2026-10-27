import { animalEntry, flockNew, flockWeeks, layerStats, speciesOfCategory, tapeWeight, weightEntry, type AnimalInput } from "@/lib/records";

const today = "2026-10-27";
const a = (x: Partial<AnimalInput>): AnimalInput => ({
  id: null, tag: " C-9 ", name: "", category: "cow", breed: "Sahiwal", dob: "2023-01-10", purchaseDate: "", purchasePrice: "",
  motherId: null, father: "", notes: "", status: "active", fattening: false, targetKg: "", startKg: "", ...x,
});

test("animals: tag and type needed, dates checked, fattening fields only on a new animal", () => {
  const r = animalEntry(a({}), today);
  expect(r.ok && r.entry).toEqual({ tag_number: "C-9", name: null, category: "cow", breed: "Sahiwal", date_of_birth: "2023-01-10", purchase_date: null, purchase_price: null, mother_id: null, father: null, notes: null });
  expect(animalEntry(a({ tag: " " }), today)).toEqual({ ok: false, error: "animal.err.tag" });
  expect(animalEntry(a({ category: "" }), today)).toEqual({ ok: false, error: "animal.err.type" });
  expect(animalEntry(a({ dob: "2027-01-01" }), today)).toEqual({ ok: false, error: "rec.err.future" });
  expect(animalEntry(a({ id: "x", motherId: "x" }), today)).toEqual({ ok: false, error: "animal.err.motherSelf" });
  const bull = animalEntry(a({ category: "bull", fattening: true, purchaseDate: "2026-10-01", purchasePrice: "৮৫০০০", targetKg: "350", startKg: "250" }), today);
  expect(bull.ok && [bull.entry.is_fattening, bull.entry.fattening_start, bull.entry.purchase_price, bull.entry.target_weight_kg, bull.startKg]).toEqual([true, "2026-10-01", 85000, 350, 250]);
  const edit = animalEntry(a({ id: "x", status: "sold", fattening: true }), today);
  expect(edit.ok && [edit.entry.status, edit.entry.is_fattening]).toEqual(["sold", undefined]);
  expect(speciesOfCategory({ species: "goat" })).toBe("goat");
  expect(speciesOfCategory(null)).toBe("cattle");
});

test("weights: scale or tape (girth² × length ÷ 10838)", () => {
  expect(tapeWeight(170, 150)).toBe(400);
  expect(weightEntry({ date: today, method: "tape", kg: "", girth: "১৭০", length: "150" }, today)).toEqual({
    ok: true, entry: { weigh_date: today, weight_kg: 400, method: "tape", heart_girth_cm: 170, body_length_cm: 150 },
  });
  expect(weightEntry({ date: today, method: "scale", kg: "312.46", girth: "", length: "" }, today)).toEqual({
    ok: true, entry: { weigh_date: today, weight_kg: 312.5, method: "scale", heart_girth_cm: null, body_length_cm: null },
  });
  expect(weightEntry({ date: today, method: "scale", kg: "0", girth: "", length: "" }, today)).toEqual({ ok: false, error: "weight.err.kg" });
  expect(weightEntry({ date: today, method: "tape", kg: "", girth: "5", length: "150" }, today)).toEqual({ ok: false, error: "weight.err.tape" });
});

test("new flocks and layer numbers", () => {
  const b = flockNew({ name: " Batch 7 ", kind: "broiler", breed: "Cobb", shed: "", date: today, count: "1000", ageWeeks: "18", chickPrice: "52" }, today);
  expect(b.ok && b.entry).toEqual({ name: "Batch 7", kind: "broiler", breed: "Cobb", shed: null, placed_date: today, initial_count: 1000, age_at_placement_weeks: 0, chick_price: 52 });
  const l = flockNew({ name: "Shed A", kind: "layer", breed: "", shed: "A", date: today, count: "500", ageWeeks: "18", chickPrice: "52" }, today);
  expect(l.ok && [l.entry.age_at_placement_weeks, l.entry.chick_price]).toEqual([18, null]);
  expect(flockNew({ name: "x", kind: "layer", breed: "", shed: "", date: today, count: "0", ageWeeks: "", chickPrice: "" }, today)).toEqual({ ok: false, error: "flock.err.count" });
  expect(flockWeeks("2026-09-29", 18, today)).toBe(22);
  const s = layerStats(100, [
    { log_date: "2026-10-26", eggs_collected: 90, mortality: 2, culled: 0, feed_kg: 11 },
    { log_date: "2026-10-27", eggs_collected: 98, mortality: 0, culled: 0, feed_kg: 11 },
  ]);
  expect(s.alive).toBe(98);
  expect(Math.round(s.henDay7)).toBe(95);
  expect(s.mortalityPct).toBe(2);
  expect(s.feedPerDozen).toBeCloseTo(22 / (188 / 12));
});
