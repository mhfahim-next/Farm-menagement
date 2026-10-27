import { ageParts, milkingCategories, optionLabel, type OptionRow } from "@/lib/options";

const rows: OptionRow[] = [
  { list_key: "cattle_category", value: "cow", label_en: "Cow", label_bn: "গাভী", meta: { milking: true }, active: true, sort_order: 1 },
  { list_key: "cattle_category", value: "bull", label_en: "Bull", label_bn: null, meta: {}, active: true, sort_order: 2 },
];

test("labels in the reader's language, falling back to English or the value", () => {
  expect(optionLabel(rows, "cattle_category", "cow", "bn")).toBe("গাভী");
  expect(optionLabel(rows, "cattle_category", "bull", "bn")).toBe("Bull");
  expect(optionLabel(rows, "cattle_category", "yak", "en")).toBe("yak");
  expect(optionLabel(null, "cattle_category", null, "en")).toBe("");
});

test("milking types come from the list (cows until it loads)", () => {
  expect(milkingCategories(rows)).toEqual(["cow"]);
  expect(milkingCategories(null)).toEqual(["cow"]);
});

test("age from the date of birth", () => {
  expect(ageParts("2023-08-15", "2026-10-27")).toEqual({ y: 3, m: 2, d: 0 });
  expect(ageParts("2026-10-15", "2026-10-27")).toEqual({ y: 0, m: 0, d: 12 });
  expect(ageParts("2026-06-30", "2026-10-27")).toEqual({ y: 0, m: 3, d: 0 });
  expect(ageParts(null, "2026-10-27")).toBeNull();
  expect(ageParts("2027-01-01", "2026-10-27")).toBeNull();
});
