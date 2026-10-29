import { add, decide, diff, flush, readAll, type NewEntry, type OutboxEntry, type Store } from "@/lib/outbox-core";
import { overlay } from "@/lib/overlay";

const mem = (): Store & { v: string | null } => ({ v: null, get() { return this.v; }, set(v) { this.v = v; } });
const base = { farmId: "f", userId: "u" };

describe("last change wins", () => {
  const made = Date.parse("2026-10-29T10:00:00Z");
  test("unchanged on the server, or no row: write", () => {
    expect(decide(null, null, made)).toBe("write");
    expect(decide("2026-10-28T09:00:00Z", "2026-10-28T09:00:00Z", made)).toBe("write");
  });
  test("changed elsewhere after the entry was made: the server's stays", () => {
    expect(decide("2026-10-29T11:00:00Z", "2026-10-28T09:00:00Z", made)).toBe("keep");
    expect(decide("2026-10-29T11:00:00Z", undefined, made)).toBe("keep");
  });
  test("changed elsewhere before: ours replaces it (and the person is told)", () => {
    expect(decide("2026-10-29T09:00:00Z", "2026-10-28T09:00:00Z", made)).toBe("replace");
    expect(decide("2026-10-29T09:00:00Z", null, made)).toBe("replace");
    // Not known what the screen showed: written without a note.
    expect(decide("2026-10-29T09:00:00Z", undefined, made)).toBe("write");
  });
});

test("diff keeps only changed fields", () => {
  expect(diff({ name: "Lali", status: "active", father: null }, { name: "Lali", status: "sold", father: undefined })).toEqual({ status: "active" });
});

describe("merging entries that wait", () => {
  test("changes to a new animal that waits go into it; deleting it drops it and its changes", () => {
    const s = mem();
    add(s, { ...base, kind: "animal", data: { id: "a1", isNew: true, row: { tag_number: "7", category: "cow" }, weight: null, label: "x" } }, "1", 1);
    add(s, { ...base, kind: "update", data: { table: "cattle", id: "a1", patch: { name: "Lali" }, label: "x" } }, "2", 2);
    let list = readAll(s);
    expect(list).toHaveLength(1);
    expect(list[0].kind === "animal" && list[0].data.row).toEqual({ tag_number: "7", category: "cow", name: "Lali" });
    add(s, { ...base, kind: "delete", data: { table: "cattle", id: "a1", label: "x" } }, "3", 3);
    list = readAll(s);
    expect(list).toHaveLength(0);
  });

  test("two edits of one row become one, keeping what the server had first", () => {
    const s = mem();
    add(s, { ...base, kind: "update", data: { table: "staff", id: "s1", patch: { name: "A" }, seen: "t0", before: { name: "Old" }, label: "x" } }, "1", 1);
    add(s, { ...base, kind: "update", data: { table: "staff", id: "s1", patch: { phone: "1" }, seen: "t1", before: { phone: null }, label: "x" } }, "2", 2);
    const list = readAll(s);
    expect(list).toHaveLength(1);
    const e = list[0];
    expect(e.kind === "update" && e.data).toMatchObject({ patch: { name: "A", phone: "1" }, seen: "t0", before: { name: "Old", phone: null } });
  });

  test("one day's attendance: the latest marks win, back to present removes a mark", () => {
    const s = mem();
    add(s, { ...base, kind: "attendance", data: { date: "2026-10-29", marks: [{ staff_id: "a", status: "absent", note: null }, { staff_id: "b", status: "leave", note: null }], present: [], label: "x" } }, "1", 1);
    add(s, { ...base, kind: "attendance", data: { date: "2026-10-29", marks: [{ staff_id: "c", status: "half_day", note: null }], present: ["a"], label: "x" } }, "2", 2);
    const [e] = readAll(s);
    expect(e.kind === "attendance" && e.data.marks.map((m) => m.staff_id).sort()).toEqual(["b", "c"]);
    expect(e.kind === "attendance" && e.data.present).toEqual(["a"]);
  });
});

test("conflicts reported while sending are passed on, and the entry is done", async () => {
  const s = mem();
  add(s, { ...base, kind: "update", data: { table: "cattle", id: "a", patch: { name: "B" }, label: "#7" } }, "1", 1);
  const seen: string[] = [];
  const r = await flush(s, "u", async () => ({ conflicts: [{ label: "#7", kept: "theirs" }] }), (e, c) => seen.push(`${e.id}:${c[0].kept}`));
  expect(r).toEqual({ sent: 1, failed: 0, waiting: 0 });
  expect(seen).toEqual(["1:theirs"]);
});

describe("screens show what waits on the phone", () => {
  const e = (x: Omit<NewEntry, "farmId" | "userId">, id: string): OutboxEntry => ({ ...base, ...x, id, createdAt: 1, error: null }) as OutboxEntry;
  const animal = { id: "a", tag_number: "1", name: null, breed: null, category: "cow", status: "active", species: "cattle", date_of_birth: null, is_fattening: false, sex: "female", photo_path: null };

  test("a new animal is in the list and has its page; deleted ones are gone", () => {
    const pending = [
      e({ kind: "animal", data: { id: "n", isNew: true, row: { tag_number: "10", category: "heifer", name: "Moti" }, weight: { id: "w", weigh_date: "2026-10-29", weight_kg: 210, method: "scale" }, label: "x" } }, "1"),
      e({ kind: "delete", data: { table: "cattle", id: "a", label: "x" } }, "2"),
    ];
    const list = overlay("animals.f", [animal], pending) as { id: string; tag_number: string }[];
    expect(list.map((x) => x.tag_number)).toEqual(["10"]);
    const page = overlay("animal.n", null, pending) as { animal: { tag_number: string; name: string }; weights: { weight_kg: number }[] };
    expect(page.animal).toMatchObject({ tag_number: "10", name: "Moti" });
    expect(page.weights.map((w) => w.weight_kg)).toEqual([210]);
  });

  test("a vaccine for many animals shows on each page; an edit changes the shown record", () => {
    const detail = { animal: { ...animal, farm_id: "f", purchase_date: null, father: null, mother_id: null, notes: null, purchase_price: null, fattening_start: null, target_weight_kg: null, created_at: "", updated_at: null, mother: null }, weights: [], costs: 0, sale: null, settings: { targetDate: null, dailyCost: 0, pricePerKg: 0 }, milk: [], health: [], breeding: [] };
    const pending = [
      e({ kind: "health", data: { cattle_ids: ["a", "b"], ids: ["h1", "h2"], record_date: "2026-10-29", record_type: "vaccination", product: "FMD", interval_days: 180, next_due_date: "2027-04-27", cost: 50, notes: null, label: "x" } }, "1"),
      e({ kind: "update", data: { table: "health_records", id: "h1", patch: { cost: 80 }, label: "x" } }, "2"),
    ];
    const page = overlay("animal.a", detail, pending) as { health: { id: string; cost: number }[]; costs: number };
    expect(page.health).toHaveLength(1);
    expect(page.health[0]).toMatchObject({ id: "h1", cost: 80 });
    expect(page.costs).toBe(50);
  });

  test("today's milking counts as done, and the milk sheet shows the litres typed", () => {
    const pending = [e({ kind: "milk", data: { record_date: "2026-10-29", session: "morning", rows: [{ cattle_id: "a", quantity_liters: 6 }] } }, "1")];
    expect(overlay("today.f.2026-10-29", { sessions: [], flocks: [], litres: 0, eggs: 0 }, pending)).toEqual({ sessions: ["morning"], flocks: [], litres: 6, eggs: 0 });
    expect(overlay("milkday.f.2026-10-29.morning", { values: { b: "4" }, seen: {} }, pending)).toEqual({ values: { b: "4", a: "6" }, seen: {} });
    expect(overlay("milkday.f.2026-10-29.evening", null, pending)).toBeNull();
  });

  test("a sale on credit raises the buyer's due; a payment lowers it", () => {
    const buyers = [{ id: "b", name: "Karim", phone: null, milk_rate: null, egg_rate: null, due: 100, last_sale: null }];
    const pending = [
      e({ kind: "sale", data: { id: "s", sale_date: "2026-10-29", product: "milk", module: "dairy", quantity: 10, unit: "litre", unit_price: 60, amount: 600, paid_amount: 200, buyer_id: "b", cattle_id: null, flock_id: null, head_count: null, notes: null, label: "x" } }, "1"),
      e({ kind: "payment", data: { id: "p", buyer_id: "b", pay_date: "2026-10-29", amount: 150, method: "cash", notes: null, label: "x" } }, "2"),
    ];
    const [b] = overlay("buyers.f", buyers, pending) as { due: number; last_sale: string }[];
    expect(b).toMatchObject({ due: 350, last_sale: "2026-10-29" });
  });

  test("stock: a purchase and a use change what is on hand", () => {
    const item = { id: "i", name: "Feed", kind: "feed", unit: "kg", unit_kg: null, module: "dairy", low_stock: null, notes: null, archived: false, on_hand: 100, avg_cost: 40, used_30d: 10, last_purchase: null };
    const pending = [
      e({ kind: "insert", data: { table: "inventory_moves", row: { id: "m1", item_id: "i", move_type: "purchase", quantity: 50, move_date: "2026-10-29" }, label: "x" } }, "1"),
      e({ kind: "insert", data: { table: "inventory_moves", row: { id: "m2", item_id: "i", move_type: "use", quantity: 20, move_date: "2026-10-29" }, label: "x" } }, "2"),
    ];
    const [i] = overlay("stock.f", [item], pending) as { on_hand: number; used_30d: number }[];
    expect(i).toMatchObject({ on_hand: 130, used_30d: 30 });
    expect((overlay("moves.i", [], pending) as unknown[]).length).toBe(2);
  });

  test("nothing waiting: the server's copy as it is", () => {
    const data = [animal];
    expect(overlay("animals.f", data, [])).toBe(data);
  });
});
