// What a screen shows = the copy from the server + the entries still waiting
// on the phone. A new animal, a vaccine or a sale typed without internet is
// in its list at once; once sent, the server's copy (which then has it)
// takes over. Pure, so the rules are unit-tested.
import type {
  AnimalDetail,
  AnimalRow,
  Animal,
  Buyer,
  Flock,
  FlockDetail,
  FlockLog,
  FlockRow,
  MilkDay,
  PaymentRow,
  SaleRow,
  StaffMember,
  StaffPayment,
  Attendance,
  StockItem,
  StockMove,
  Today,
  TxnRow,
} from "./data";
import type { OutboxEntry, Row } from "./outbox-core";

type E = OutboxEntry;
const str = (v: unknown) => (v === null || v === undefined ? null : String(v));
const num = (v: unknown) => Number(v ?? 0);

/** Rows added to a table by waiting entries (new rows, new animals, calves). */
function inserted(entries: E[], table: string): Row[] {
  const out: Row[] = [];
  for (const e of entries) {
    if (e.kind === "insert" && e.data.table === table) out.push({ farm_id: e.farmId, ...e.data.row });
    if (table === "cattle" && e.kind === "animal" && e.data.isNew) out.push({ id: e.data.id, farm_id: e.farmId, status: "active", species: e.data.species ?? "cattle", photo_path: e.data.photo?.uri ?? null, ...e.data.row });
    if (table === "cattle" && e.kind === "breeding" && e.data.calf && e.data.calf_id) {
      out.push({ id: e.data.calf_id, farm_id: e.farmId, status: "active", date_of_birth: e.data.event_date, mother_id: e.data.cattle_id, ...e.data.calf });
    }
  }
  return out;
}

/** Waiting changes to rows of a table, by id (later changes win). */
function patches(entries: E[], table: string): Map<string, Row> {
  const m = new Map<string, Row>();
  for (const e of entries) {
    if (e.kind === "update" && e.data.table === table) m.set(e.data.id, { ...m.get(e.data.id), ...e.data.patch });
    if (table === "cattle" && e.kind === "animal" && !e.data.isNew) {
      m.set(e.data.id, { ...m.get(e.data.id), ...e.data.row, ...(e.data.photo ? { photo_path: e.data.photo.uri } : {}) });
    }
  }
  return m;
}

/** Ids deleted by waiting entries. */
function deleted(entries: E[], table: string): Set<string> {
  return new Set(entries.filter((e) => e.kind === "delete" && e.data.table === table).map((e) => (e.kind === "delete" ? e.data.id : "")));
}

/** A list with the waiting changes: patched, deleted rows removed, new rows added (once). */
function merge<T extends { id: string }>(list: T[], table: string, entries: E[], make: (r: Row) => T, keep: (r: T) => boolean = () => true, first = false): T[] {
  const p = patches(entries, table);
  const gone = deleted(entries, table);
  const have = new Set(list.map((r) => r.id));
  const fresh = inserted(entries, table)
    .filter((r) => !have.has(String(r.id)))
    .map((r) => make({ ...r, ...p.get(String(r.id)) }));
  const changed = list.map((r) => (p.has(r.id) ? ({ ...r, ...p.get(r.id) } as T) : r));
  const all = first ? [...fresh.reverse(), ...changed] : [...changed, ...fresh];
  return all.filter((r) => !gone.has(r.id) && keep(r));
}

const animalOf = (r: Row): Animal => ({
  id: String(r.id),
  tag_number: String(r.tag_number ?? ""),
  name: str(r.name),
  breed: str(r.breed),
  category: String(r.category ?? ""),
  status: String(r.status ?? "active"),
  species: str(r.species) ?? "cattle",
  date_of_birth: str(r.date_of_birth),
  is_fattening: Boolean(r.is_fattening),
  sex: str(r.sex),
  photo_path: str(r.photo_path),
});

const byTag = (a: Animal, b: Animal) => a.tag_number.localeCompare(b.tag_number, undefined, { numeric: true });

function animals(list: Animal[], entries: E[]) {
  return merge(list, "cattle", entries, animalOf).sort(byTag);
}

const ofCattle = (entries: E[], id: string) => ({
  health: entries.flatMap((e) =>
    e.kind === "health"
      ? e.data.cattle_ids
          .map((c, i) => ({ c, i }))
          .filter((x) => x.c === id)
          .map(({ i }) => ({
            id: e.data.ids[i],
            cattle_id: id,
            record_date: e.data.record_date,
            record_type: e.data.record_type,
            description: e.data.notes ?? e.data.product,
            product: e.data.product,
            next_due_date: e.data.next_due_date,
            cost: e.data.cost,
            interval_days: e.data.interval_days,
            updated_at: null,
          }))
      : [],
  ),
  breeding: entries.flatMap((e) =>
    e.kind === "breeding" && e.data.cattle_id === id
      ? [
          {
            id: e.data.id,
            cattle_id: id,
            event_date: e.data.event_date,
            event_type: e.data.event_type,
            result: e.data.result,
            expected_calving_date: e.data.expected_calving_date,
            cost: e.data.cost,
            bull_or_semen: e.data.bull_or_semen,
            technician: e.data.technician,
            heat_signs: e.data.heat_signs,
            notes: e.data.notes,
            updated_at: null,
          },
        ]
      : [],
  ),
  weights: inserted(entries, "cattle_weights")
    .filter((w) => w.cattle_id === id)
    .map((w) => ({ id: String(w.id), cattle_id: id, weigh_date: String(w.weigh_date), weight_kg: num(w.weight_kg), method: String(w.method ?? "scale") }))
    .concat(
      entries.flatMap((e) =>
        e.kind === "animal" && e.data.id === id && e.data.weight
          ? [{ id: e.data.weight.id, cattle_id: id, weigh_date: String(e.data.weight.weigh_date), weight_kg: num(e.data.weight.weight_kg), method: String(e.data.weight.method ?? "scale") }]
          : [],
      ),
    ),
  milk: entries.flatMap((e) => (e.kind === "milk" ? e.data.rows.filter((r) => r.cattle_id === id).map((r) => ({ record_date: e.data.record_date, quantity_liters: r.quantity_liters, session: e.data.session })) : [])),
});

const desc = <T>(key: (r: T) => string) => (a: T, b: T) => (key(a) < key(b) ? 1 : key(a) > key(b) ? -1 : 0);

function animalDetail(data: AnimalDetail | null, id: string, entries: E[]): AnimalDetail | null {
  const newRow = inserted(entries, "cattle").find((r) => r.id === id);
  if (!data && !newRow) return null;
  const base: AnimalDetail = data ?? {
    animal: null,
    weights: [],
    costs: 0,
    sale: null,
    settings: { targetDate: null, dailyCost: 0, pricePerKg: 0 },
    milk: [],
    health: [],
    breeding: [],
  };
  if (deleted(entries, "cattle").has(id)) return { ...base, animal: null };
  const patch = patches(entries, "cattle").get(id);
  let animal = base.animal;
  if (!animal && newRow) animal = { ...(newRow as unknown as AnimalRow), created_at: new Date().toISOString(), updated_at: null, mother: null };
  if (animal && patch) animal = { ...animal, ...(patch as Partial<AnimalRow>) };
  const mine = ofCattle(entries, id);
  const hp = patches(entries, "health_records");
  const bp = patches(entries, "breeding_events");
  const health = [...mine.health.filter((h) => !base.health.some((x) => x.id === h.id)), ...base.health]
    .map((h) => (hp.has(h.id) ? { ...h, ...(hp.get(h.id) as object) } : h))
    .filter((h) => !deleted(entries, "health_records").has(h.id))
    .sort(desc((h) => h.record_date));
  const breeding = [...mine.breeding.filter((b) => !base.breeding.some((x) => x.id === b.id)), ...base.breeding]
    .map((b) => (bp.has(b.id) ? { ...b, ...(bp.get(b.id) as object) } : b))
    .filter((b) => !deleted(entries, "breeding_events").has(b.id))
    .sort(desc((b) => b.event_date));
  const weights = [...mine.weights.filter((w) => !base.weights.some((x) => x.id === w.id)), ...base.weights]
    .filter((w) => !deleted(entries, "cattle_weights").has(w.id))
    .sort(desc((w) => w.weigh_date));
  // Waiting milk replaces what the server had for that day only when it's the same milking; the page shows day totals.
  const milk = [...base.milk, ...mine.milk.map(({ record_date, quantity_liters }) => ({ record_date, quantity_liters }))];
  const added = [...mine.health, ...mine.breeding].filter((r) => ![...base.health, ...base.breeding].some((x) => x.id === r.id));
  return { ...base, animal, health, breeding, weights, milk, costs: base.costs + added.reduce((s, r) => s + num(r.cost), 0) };
}

function today(data: Today | null, farmId: string, day: string, entries: E[]): Today | null {
  const milk = entries.filter((e) => e.kind === "milk" && e.farmId === farmId && e.data.record_date === day);
  const logs = entries.filter((e) => e.kind === "flock" && e.farmId === farmId && e.data.log_date === day);
  if (!data && !milk.length && !logs.length) return null;
  const base = data ?? { sessions: [], flocks: [], litres: 0, eggs: 0 };
  return {
    sessions: [...new Set([...base.sessions, ...milk.map((e) => (e.kind === "milk" ? e.data.session : ""))])],
    flocks: [...new Set([...base.flocks, ...logs.map((e) => (e.kind === "flock" ? e.data.flock_id : ""))])],
    // Rough while waiting: an entry that rewrites a milking already counted is added on top.
    litres: (base.litres ?? 0) + milk.reduce((s, e) => s + (e.kind === "milk" ? e.data.rows.reduce((t, r) => t + num(r.quantity_liters), 0) : 0), 0),
    eggs: (base.eggs ?? 0) + logs.reduce((s, e) => s + (e.kind === "flock" ? num(e.data.eggs_collected) : 0), 0),
  };
}

function milkDay(data: MilkDay | null, farmId: string, day: string, session: string, entries: E[]): MilkDay | null {
  const mine = entries.filter((e) => e.kind === "milk" && e.farmId === farmId && e.data.record_date === day && e.data.session === session);
  if (!mine.length) return data;
  const values = { ...(data?.values ?? {}) };
  for (const e of mine) if (e.kind === "milk") for (const r of e.data.rows) values[r.cattle_id] = String(r.quantity_liters);
  return { values, seen: data?.seen ?? {} };
}

function flockLog(data: FlockLog | null, flockId: string, day: string, entries: E[]): FlockLog | null {
  const e = [...entries].reverse().find((x) => x.kind === "flock" && x.data.flock_id === flockId && x.data.log_date === day);
  if (!e || e.kind !== "flock") return data;
  const s = (v: unknown) => (v === null || v === undefined ? "" : String(Number(v)));
  const d = e.data as typeof e.data & { feed_item_id?: string | null };
  return {
    eggs: s(d.eggs_collected),
    broken: s(d.eggs_broken),
    mortality: s(d.mortality),
    culled: s(d.culled),
    feed: s(d.feed_kg),
    weight: s(d.avg_weight_g),
    feedItem: d.feed_item_id ?? data?.feedItem ?? null,
    updated_at: data?.updated_at ?? null,
  };
}

const flockRowOf = (r: Row): FlockRow => ({
  id: String(r.id),
  name: String(r.name ?? ""),
  kind: (r.kind as FlockRow["kind"]) ?? "layer",
  breed: str(r.breed),
  shed: str(r.shed),
  status: String(r.status ?? "active"),
  placed_date: String(r.placed_date ?? ""),
  initial_count: num(r.initial_count),
  age_at_placement_weeks: num(r.age_at_placement_weeks),
  chick_price: r.chick_price === null || r.chick_price === undefined ? null : num(r.chick_price),
  current_count: num(r.current_count ?? r.initial_count),
});

function flockDetail(data: FlockDetail | null, id: string, entries: E[]): FlockDetail | null {
  const newRow = inserted(entries, "flocks").find((r) => r.id === id);
  if (!data && !newRow) return null;
  const base: FlockDetail = data ?? { flock: null, logs: [], health: [], sold: { birds: 0, kg: 0, amount: 0 }, feedCost: 0 };
  let flock = base.flock ?? (newRow ? flockRowOf(newRow) : null);
  const patch = patches(entries, "flocks").get(id);
  if (flock && patch) flock = { ...flock, ...(patch as Partial<FlockRow>) };
  const logs = [...base.logs];
  let died = 0;
  for (const e of entries) {
    if (e.kind !== "flock" || e.data.flock_id !== id) continue;
    const row = { log_date: e.data.log_date, eggs_collected: e.data.eggs_collected, eggs_broken: e.data.eggs_broken, mortality: e.data.mortality, culled: e.data.culled, feed_kg: e.data.feed_kg, avg_weight_g: e.data.avg_weight_g ?? null };
    const at = logs.findIndex((l) => l.log_date === row.log_date);
    const before = at >= 0 ? logs[at].mortality + logs[at].culled : 0;
    died += row.mortality + row.culled - before;
    if (at >= 0) logs[at] = row;
    else logs.push(row);
  }
  logs.sort((a, b) => (a.log_date < b.log_date ? -1 : a.log_date > b.log_date ? 1 : 0));
  const gone = deleted(entries, "flock_health_records");
  const health = [
    ...inserted(entries, "flock_health_records")
      .filter((h) => h.flock_id === id && !base.health.some((x) => x.id === h.id))
      .map((h) => ({ id: String(h.id), record_date: String(h.record_date), record_type: String(h.record_type), product: str(h.product), next_due_date: str(h.next_due_date), cost: h.cost === null || h.cost === undefined ? null : num(h.cost) })),
    ...base.health,
  ]
    .filter((h) => !gone.has(h.id))
    .sort(desc((h) => h.record_date));
  return { ...base, flock: flock ? { ...flock, current_count: Math.max(0, flock.current_count - died) } : null, logs, health };
}

function sales(data: { sales: SaleRow[]; payments: PaymentRow[] } | null, entries: E[], farmId: string | null, buyerId: string | null) {
  const mine = entries.filter((e) => (farmId ? e.farmId === farmId : true));
  const newSales: SaleRow[] = mine.flatMap((e) =>
    e.kind === "sale" && (!buyerId || e.data.buyer_id === buyerId)
      ? [{ id: e.data.id, sale_date: e.data.sale_date, product: e.data.product, quantity: e.data.quantity, unit: e.data.unit, amount: e.data.amount, paid_amount: e.data.paid_amount, buyer_id: e.data.buyer_id, cattle_id: e.data.cattle_id }]
      : [],
  );
  const newPays: PaymentRow[] = buyerId
    ? mine.flatMap((e) => (e.kind === "payment" && e.data.buyer_id === buyerId ? [{ id: e.data.id, pay_date: e.data.pay_date, amount: e.data.amount, method: e.data.method, buyer_id: e.data.buyer_id }] : []))
    : [];
  if (!data && !newSales.length && !newPays.length) return data;
  const base = data ?? { sales: [], payments: [] };
  const goneS = deleted(entries, "sales");
  const goneP = deleted(entries, "buyer_payments");
  return {
    sales: [...newSales.filter((s) => !base.sales.some((x) => x.id === s.id)).reverse(), ...base.sales].filter((s) => !goneS.has(s.id)).sort(desc((s) => s.sale_date)),
    payments: [...newPays.filter((p) => !base.payments.some((x) => x.id === p.id)).reverse(), ...base.payments].filter((p) => !goneP.has(p.id)).sort(desc((p) => p.pay_date)),
  };
}

function buyers(list: Buyer[], farmId: string, entries: E[]): Buyer[] {
  const mine = entries.filter((e) => e.farmId === farmId);
  const out = [...list];
  for (const e of mine) {
    if (e.kind === "buyer" && !out.some((b) => b.id === e.data.id)) out.push({ id: e.data.id, name: e.data.name, phone: e.data.phone, milk_rate: e.data.milk_rate, egg_rate: e.data.egg_rate, due: 0, last_sale: null });
  }
  return out
    .map((b) => {
      let due = num(b.due);
      let last = b.last_sale;
      for (const e of mine) {
        if (e.kind === "sale" && e.data.buyer_id === b.id) {
          due += num(e.data.amount) - num(e.data.paid_amount);
          if (!last || e.data.sale_date > last) last = e.data.sale_date;
        }
        if (e.kind === "payment" && e.data.buyer_id === b.id) due -= num(e.data.amount);
      }
      return { ...b, due: Math.round(due * 100) / 100, last_sale: last };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function txns(list: TxnRow[], farmId: string, from: string, entries: E[]): TxnRow[] {
  const fresh: TxnRow[] = entries.flatMap((e) =>
    e.kind === "txn" && e.farmId === farmId && e.data.txn_date >= from && !list.some((x) => x.id === e.data.id)
      ? [{ id: e.data.id, txn_date: e.data.txn_date, txn_type: e.data.txn_type, module: e.data.module, category: e.data.category, amount: e.data.amount, description: e.data.description }]
      : [],
  );
  const gone = deleted(entries, "transactions");
  return [...fresh.reverse(), ...list].filter((x) => !gone.has(x.id)).sort(desc((x) => x.txn_date));
}

/** What a stock move does to what is on hand (a count stores the difference). */
const effect = (m: Row) => (m.move_type === "use" ? -num(m.quantity) : num(m.quantity));

function stock(list: StockItem[], entries: E[]): StockItem[] {
  const moves = inserted(entries, "inventory_moves");
  const withItems = merge(list, "inventory_items", entries, (r) => ({
    id: String(r.id),
    name: String(r.name ?? ""),
    kind: String(r.kind ?? "feed"),
    unit: String(r.unit ?? "kg"),
    unit_kg: r.unit_kg === null || r.unit_kg === undefined ? null : num(r.unit_kg),
    module: String(r.module ?? "general"),
    low_stock: r.low_stock === null || r.low_stock === undefined ? null : num(r.low_stock),
    notes: str(r.notes),
    archived: Boolean(r.archived),
    on_hand: 0,
    avg_cost: null,
    used_30d: 0,
    last_purchase: null,
  }));
  return withItems
    .map((i) => {
      const mine = moves.filter((m) => m.item_id === i.id);
      if (!mine.length) return i;
      const used = mine.filter((m) => m.move_type === "use").reduce((s, m) => s + num(m.quantity), 0);
      const bought = mine.filter((m) => m.move_type === "purchase").map((m) => String(m.move_date));
      const last = [i.last_purchase, ...bought].filter(Boolean).sort().pop() ?? null;
      return { ...i, on_hand: Math.round((num(i.on_hand) + mine.reduce((s, m) => s + effect(m), 0)) * 1000) / 1000, used_30d: num(i.used_30d) + used, last_purchase: last };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function moves(list: StockMove[], itemId: string, entries: E[]): StockMove[] {
  const gone = deleted(entries, "inventory_moves");
  const fresh = inserted(entries, "inventory_moves")
    .filter((m) => m.item_id === itemId && !list.some((x) => x.id === m.id))
    .map((m) => ({
      id: String(m.id),
      move_date: String(m.move_date),
      move_type: String(m.move_type),
      quantity: num(m.quantity),
      total_cost: m.total_cost === null || m.total_cost === undefined ? null : num(m.total_cost),
      supplier: str(m.supplier),
      notes: str(m.notes),
      log_id: null,
      flock_id: str(m.flock_id),
    }));
  return [...fresh.reverse(), ...list].filter((m) => !gone.has(m.id)).sort(desc((m) => m.move_date));
}

type StaffMonth = { staff: StaffMember[]; attendance: Attendance[]; payments: StaffPayment[] };

function staffMonth(data: StaffMonth | null, farmId: string, month: string, entries: E[]): StaffMonth | null {
  const mine = entries.filter((e) => e.farmId === farmId);
  const touched = mine.some((e) => (e.kind === "insert" || e.kind === "update") && (e.data.table === "staff" || e.data.table === "staff_payments")) || mine.some((e) => e.kind === "attendance");
  if (!touched) return data;
  const base = data ?? { staff: [], attendance: [], payments: [] };
  const staff = merge(base.staff, "staff", mine, (r) => ({
    id: String(r.id),
    name: String(r.name ?? ""),
    phone: str(r.phone),
    position: str(r.position),
    module: String(r.module ?? "both"),
    monthly_salary: num(r.monthly_salary),
    join_date: String(r.join_date ?? ""),
    active: r.active === undefined ? true : Boolean(r.active),
    notes: str(r.notes),
  }));
  let attendance = [...base.attendance];
  for (const e of mine) {
    if (e.kind !== "attendance" || !e.data.date.startsWith(month)) continue;
    const touchedIds = new Set([...e.data.present, ...e.data.marks.map((m) => m.staff_id)]);
    attendance = attendance.filter((a) => !(a.att_date === e.data.date && touchedIds.has(a.staff_id)));
    attendance.push(...e.data.marks.map((m) => ({ staff_id: m.staff_id, att_date: e.data.date, status: m.status as Attendance["status"], note: m.note })));
  }
  const gone = deleted(mine, "staff_payments");
  const payments = [
    ...inserted(mine, "staff_payments")
      .filter((p) => String(p.pay_month) === `${month}-01` && !base.payments.some((x) => x.id === p.id))
      .map((p) => ({ id: String(p.id), staff_id: String(p.staff_id), pay_month: String(p.pay_month), pay_type: p.pay_type as StaffPayment["pay_type"], amount: num(p.amount), paid_on: String(p.paid_on), note: str(p.note) })),
    ...base.payments,
  ].filter((p) => !gone.has(p.id));
  return { staff, attendance, payments };
}

/** The screen's data for a saved-copy key, with the waiting entries applied. */
export function overlay(key: string, data: unknown, entries: E[]): unknown {
  if (!entries.length) return data;
  const [kind, a, b, c] = key.split(".");
  switch (kind) {
    case "animals":
      return data || inserted(entries, "cattle").length ? animals((data as Animal[] | null) ?? [], entries.filter((e) => e.farmId === a)) : data;
    case "animal":
      return animalDetail(data as AnimalDetail | null, a, entries);
    case "today":
      return today(data as Today | null, a, b, entries);
    case "milkday":
      return milkDay(data as MilkDay | null, a, b, c, entries);
    case "flocklog":
      return flockLog(data as FlockLog | null, a, b, entries);
    case "flocks": {
      const list = merge((data as Flock[] | null) ?? [], "flocks", entries.filter((e) => e.farmId === a), (r) => ({ id: String(r.id), name: String(r.name ?? ""), kind: (r.kind as Flock["kind"]) ?? "layer", breed: str(r.breed), birds: num(r.initial_count) }), (f) => (f as Flock & { status?: string }).status === undefined || (f as Flock & { status?: string }).status === "active");
      return data || list.length ? list.sort((x, y) => x.name.localeCompare(y.name)) : data;
    }
    case "allFlocks": {
      const list = merge((data as FlockRow[] | null) ?? [], "flocks", entries.filter((e) => e.farmId === a), flockRowOf, undefined, true);
      return data || list.length ? list : data;
    }
    case "flock":
      return flockDetail(data as FlockDetail | null, a, entries);
    case "sales":
      return sales(data as { sales: SaleRow[]; payments: PaymentRow[] } | null, entries, a, null);
    case "buyer":
      return sales(data as { sales: SaleRow[]; payments: PaymentRow[] } | null, entries, null, a);
    case "buyers":
      return data || entries.some((e) => e.kind === "buyer" && e.farmId === a) ? buyers((data as Buyer[] | null) ?? [], a, entries) : data;
    case "txns":
      return data || entries.some((e) => e.kind === "txn" && e.farmId === a) ? txns((data as TxnRow[] | null) ?? [], a, b, entries) : data;
    case "stock":
      return data || inserted(entries, "inventory_items").length ? stock((data as StockItem[] | null) ?? [], entries.filter((e) => e.farmId === a)) : data;
    case "moves":
      return data || inserted(entries, "inventory_moves").some((m) => m.item_id === a) ? moves((data as StockMove[] | null) ?? [], a, entries) : data;
    case "staff":
      return staffMonth(data as StaffMonth | null, a, b, entries);
    default:
      return data;
  }
}
