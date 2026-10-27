import { morningBody, planNotes } from "@/lib/notify-plan";

const texts = { morning: { title: "3 things today", body: "a · b · c" }, nudge: { title: "FarmFlows", body: "See today's work" }, evening: { title: "Milk", body: "Not entered yet" } };

test("before 7 am: today's list this morning, nudges after, and tonight's milk reminder", () => {
  const now = new Date(2026, 9, 27, 6, 30);
  const plan = planNotes(now, texts);
  expect(plan[0]).toMatchObject({ id: "morning-0", title: "3 things today", url: "/reminders" });
  expect(plan[0].at.getHours()).toBe(7);
  expect(plan[0].at.getDate()).toBe(27);
  expect(plan[1]).toMatchObject({ id: "morning-1", title: "FarmFlows" });
  expect(plan.filter((n) => n.id.startsWith("morning"))).toHaveLength(7);
  const evening = plan.find((n) => n.id === "evening")!;
  expect([evening.at.getDate(), evening.at.getHours(), evening.url]).toEqual([27, 20, "/entry"]);
});

test("after 8 pm: starts tomorrow morning, no evening note", () => {
  const plan = planNotes(new Date(2026, 9, 27, 21, 0), texts);
  expect(plan[0].at.getDate()).toBe(28);
  expect(plan.some((n) => n.id === "evening")).toBe(false);
});

test("nothing to do: only nudges; milk entered: no evening note", () => {
  const plan = planNotes(new Date(2026, 9, 27, 12, 0), { ...texts, morning: null, evening: null });
  expect(plan.every((n) => n.title === "FarmFlows")).toBe(true);
  expect(plan.some((n) => n.id === "evening")).toBe(false);
});

test("the morning note lists the first few", () => {
  expect(morningBody(["a", "b"])).toBe("a · b");
  expect(morningBody(["a", "b", "c", "d", "e"])).toBe("a · b · c · +2");
});
