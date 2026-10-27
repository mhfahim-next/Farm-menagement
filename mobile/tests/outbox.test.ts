import { add, flush, mine, readAll, type NewEntry, type Store } from "@/lib/outbox-core";

const mem = (): Store & { v: string | null } => ({ v: null, get() { return this.v; }, set(v) { this.v = v; } });
const milk = (date: string, rows: [string, number][], userId = "u"): NewEntry => ({
  kind: "milk", farmId: "f", userId, data: { record_date: date, session: "morning", rows: rows.map(([cattle_id, quantity_liters]) => ({ cattle_id, quantity_liters })) },
});

test("a second milking sheet for the same day and session merges into the first", () => {
  const s = mem();
  add(s, milk("2026-10-27", [["a", 5], ["b", 6]]), "1", 1);
  add(s, milk("2026-10-27", [["b", 7]]), "2", 2);
  add(s, milk("2026-10-26", [["a", 4]]), "3", 3);
  const list = readAll(s);
  expect(list).toHaveLength(2);
  const today = list.find((e) => e.kind === "milk" && e.data.record_date === "2026-10-27");
  expect(today?.kind === "milk" && today.data.rows).toEqual([{ cattle_id: "a", quantity_liters: 5 }, { cattle_id: "b", quantity_liters: 7 }]);
});

test("sending: in order, stops when offline, marks refused entries, only this person's", async () => {
  const s = mem();
  add(s, milk("2026-10-25", [["a", 1]]), "1", 1);
  add(s, milk("2026-10-26", [["a", 2]]), "2", 2);
  add(s, milk("2026-10-27", [["a", 3]]), "3", 3);
  add(s, milk("2026-10-27", [["a", 3]], "other"), "4", 4);

  const seen: string[] = [];
  let r = await flush(s, "u", async (e) => (seen.push(e.id), e.id === "2" ? { error: "offline", network: true } : null));
  expect(seen).toEqual(["1", "2"]);
  expect(r).toEqual({ sent: 1, failed: 0, waiting: 2 });

  r = await flush(s, "u", async (e) => (e.id === "2" ? { error: "Not allowed", network: false } : null));
  expect(r).toEqual({ sent: 1, failed: 1, waiting: 0 });
  expect(mine(s, "u").map((e) => [e.id, e.error])).toEqual([["2", "Not allowed"]]);
  expect(mine(s, "other")).toHaveLength(1);
});

test("broken storage reads as empty", () => {
  const s = mem();
  s.v = "{oops";
  expect(readAll(s)).toEqual([]);
});
