import { flockEntry, isNetworkError, milkEntry, parseNumber } from "@/lib/entries";

test("numbers can be typed with Bangla digits or a decimal comma", () => {
  expect(parseNumber("১২.৫")).toBe(12.5);
  expect(parseNumber("7,5")).toBe(7.5);
  expect(parseNumber(" 8 ")).toBe(8);
  expect(parseNumber("")).toBeNull();
  expect(parseNumber("abc")).toBeNaN();
  expect(parseNumber("-2")).toBeNaN();
});

test("milking sheet: blank cows skipped, bad numbers refused", () => {
  const r = milkEntry("2026-10-27", "morning", { a: "5.5", b: "", c: "৪" });
  expect(r).toEqual({ ok: true, total: 9.5, entry: { record_date: "2026-10-27", session: "morning", rows: [{ cattle_id: "a", quantity_liters: 5.5 }, { cattle_id: "c", quantity_liters: 4 }] } });
  expect(milkEntry("d", "s", { a: "", b: " " })).toEqual({ ok: false, error: "entry.err.none" });
  expect(milkEntry("d", "s", { a: "x" })).toEqual({ ok: false, error: "entry.err.number" });
  expect(milkEntry("d", "s", { a: "500" })).toEqual({ ok: false, error: "entry.err.tooMuch" });
  expect(milkEntry("d", "s", { a: "0" }).ok).toBe(true);
});

test("flock day: whole counts, decimal feed, weight only for meat birds", () => {
  const f = { eggs: "৯৫০", broken: "", mortality: "2", culled: "", feed: "52.5", weight: "1200" };
  expect(flockEntry("f", "2026-10-27", f, false)).toEqual({
    ok: true,
    entry: { flock_id: "f", log_date: "2026-10-27", eggs_collected: 950, eggs_broken: 0, mortality: 2, culled: 0, feed_kg: 52.5 },
  });
  const meat = flockEntry("f", "d", f, true);
  expect(meat.ok && meat.entry.avg_weight_g).toBe(1200);
  expect(flockEntry("f", "d", { ...f, eggs: "1.5" }, false)).toEqual({ ok: false, error: "entry.err.whole" });
  expect(flockEntry("f", "d", { eggs: "", broken: "", mortality: "", culled: "", feed: "" }, false)).toEqual({ ok: false, error: "entry.err.none" });
});

test("only connection failures are kept for later", () => {
  expect(isNetworkError({ message: "TypeError: Network request failed" })).toBe(true);
  expect(isNetworkError({ message: "TypeError: Failed to fetch" })).toBe(true);
  expect(isNetworkError({ message: "new row violates row-level security policy" })).toBe(false);
  expect(isNetworkError(null)).toBe(false);
});
