import { defaultSession, farmHour, fillFrom, filledCount, stepLitres, todayStatus } from "../src/lib/entry-helpers";

test("morning until 2 pm Bangladesh time", () => {
  expect(defaultSession(6)).toBe("morning");
  expect(defaultSession(13)).toBe("morning");
  expect(defaultSession(14)).toBe("evening");
  expect(farmHour(new Date("2026-10-27T01:30:00Z"))).toBe(7);
  expect(farmHour(new Date("2026-10-27T20:00:00Z"))).toBe(2);
});

test("− / + steps half a litre and never goes below zero", () => {
  expect(stepLitres("", 0.5)).toBe("0.5");
  expect(stepLitres("6", 0.5)).toBe("6.5");
  expect(stepLitres("৬.৫", 0.5)).toBe("7");
  expect(stepLitres("0.5", -0.5)).toBe("");
  expect(stepLitres("", -0.5)).toBe("");
  expect(stepLitres("6.3", 0.5)).toBe("7");
});

test("same as yesterday fills only the empty cows on the sheet", () => {
  const r = fillFrom({ a: "6", b: "5", c: "4", gone: "9" }, { a: "7", b: "" }, ["a", "b", "c", "d"]);
  expect(r.values).toEqual({ a: "7", b: "5", c: "4" });
  expect(r.filled).toBe(2);
  expect(filledCount(r.values, ["a", "b", "c", "d"])).toBe(3);
});

test("today's status shows what is still to write", () => {
  const s = todayStatus(["morning"], ["f1"], ["f1", "f2"], true);
  expect(s.milk).toEqual([
    { session: "morning", done: true },
    { session: "evening", done: false },
  ]);
  expect(s.milkPending).toBe(true);
  expect(s.flocksPending).toBe(true);
  expect(todayStatus([], [], [], false)).toEqual({ milk: [], flocks: [], milkPending: false, flocksPending: false });
});
