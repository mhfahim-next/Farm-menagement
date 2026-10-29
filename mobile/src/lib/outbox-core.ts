// Entries saved on the phone while there is no internet ("outbox"), sent in
// the order they were made once the connection is back. Kept in the phone's
// storage, so they survive closing the app. Pure (storage and sending are
// passed in) so the rules are unit-tested.
import type { FlockEntry, MilkEntry } from "./entries";
import type { BreedingEntry, BuyerEntry, HealthEntry, PaymentEntry, SaleEntry, TxnEntry } from "./records";

/** A short description saved with the entry ("Vaccination · FMD · 3 animals"), shown while it waits. */
type Labelled = { label: string };

/** A database row as the app sends it. */
export type Row = Record<string, unknown>;

/** Tables the app adds rows to through the outbox (each row carries an id made on the phone). */
export type InsertTable = "cattle_weights" | "flock_health_records" | "flocks" | "staff" | "staff_payments" | "inventory_items" | "inventory_moves";
/** Tables whose rows the app changes through the outbox. */
export type UpdateTable = "cattle" | "health_records" | "breeding_events" | "flocks" | "staff" | "inventory_items";
/** Tables whose rows the app deletes through the outbox. */
export type DeleteTable =
  | "cattle"
  | "health_records"
  | "breeding_events"
  | "sales"
  | "buyer_payments"
  | "transactions"
  | "cattle_weights"
  | "flock_health_records"
  | "staff_payments"
  | "inventory_moves";

/**
 * `seen` is the row's last change time on the server as the screen showed it
 * (null: there was no row; missing: not known). When the server row changed
 * after that, the later of the two changes is kept and the person is told.
 */
type Seen = { seen?: string | null };
/** The changed fields' values before the change (a change elsewhere to other fields is no conflict). */
type Before = { before?: Row };

export type OutboxEntry = {
  id: string;
  farmId: string;
  userId: string;
  createdAt: number;
  /** Why the server refused it; such entries wait for the person to discard them. */
  error?: string | null;
} & (
  | { kind: "milk"; data: MilkEntry & { seen?: Record<string, string | null> } }
  | { kind: "flock"; data: FlockEntry & Seen & { flock_name: string } }
  // Rows get their ids on the phone, so sending twice (connection lost after
  // the server saved) never makes a second copy.
  | { kind: "health"; data: HealthEntry & Labelled & { ids: string[] } }
  | { kind: "breeding"; data: BreedingEntry & Labelled & { id: string; calf_id: string | null } }
  | { kind: "sale"; data: SaleEntry & Labelled & { id: string } }
  | { kind: "payment"; data: PaymentEntry & Labelled & { id: string } }
  | { kind: "buyer"; data: BuyerEntry & Labelled }
  | { kind: "txn"; data: TxnEntry & Labelled & { id: string } }
  | { kind: "insert"; data: Labelled & { table: InsertTable; row: Row & { id: string } } }
  | { kind: "update"; data: Labelled & Seen & Before & { table: UpdateTable; id: string; patch: Row } }
  | { kind: "delete"; data: Labelled & { table: DeleteTable; id: string; photo?: string | null } }
  // A new animal (with its first weight) or changes to one; the photo is kept
  // on the phone until it can be uploaded (null removes the photo).
  | {
      kind: "animal";
      data: Labelled &
        Seen &
        Before & {
          id: string;
          isNew: boolean;
          row: Row;
          /** Shown on the phone while it waits (the server works it out from the type). */
          species?: string | null;
          photo?: { uri: string | null; old: string | null };
          weight: (Row & { id: string }) | null;
        };
    }
  // One day's attendance: who is marked (absent, half day, leave) and who is back to present.
  | { kind: "attendance"; data: Labelled & { date: string; marks: { staff_id: string; status: string; note: string | null }[]; present: string[]; seen?: Record<string, string | null> } }
);

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
export type NewEntry = DistributiveOmit<OutboxEntry, "id" | "createdAt" | "error">;

export type Store = { get(): string | null; set(v: string): void };
/** What happened when a change met a newer or different one on the server. */
export type Conflict = { label: string; kept: "theirs" | "mine" | "gone"; n?: number };
export type SyncNote = Conflict & { id: string; userId: string; farmId: string; at: number };

/**
 * Sends one entry: null (or the conflicts met) when saved, else the error and
 * whether it was the connection.
 */
export type Sender = (e: OutboxEntry) => Promise<{ error: string; network: boolean } | { conflicts: Conflict[] } | null>;

/**
 * Last change wins. `server` is when the row was last changed on the server
 * (null: no row), `seen` what the screen showed, `made` when the entry was made.
 */
/** The fields of `patch` that differ between two rows. */
export function changedFields(patch: Row, a: Row, b: Row) {
  return Object.keys(patch).filter((k) => String(a[k] ?? null) !== String(b[k] ?? null));
}

/** Only the fields that differ from the row as it was loaded. */
export function diff(next: Row, was: Row): Row {
  return Object.fromEntries(Object.entries(next).filter(([k, v]) => String(v ?? null) !== String(was[k] ?? null)));
}

export function decide(server: string | null, seen: string | null | undefined, made: number): "write" | "replace" | "keep" {
  if (server === null || server === seen) return "write";
  if (Date.parse(server) > made) return "keep";
  return seen === undefined ? "write" : "replace";
}

export function readAll(store: Store): OutboxEntry[] {
  try {
    const v = JSON.parse(store.get() ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

const write = (store: Store, list: OutboxEntry[]) => store.set(JSON.stringify(list));

/** Same person, farm, kind and day (and session / flock) replaces the older entry: the newest numbers win, as online. */
const sameSlot = (a: OutboxEntry, b: NewEntry) =>
  a.userId === b.userId &&
  a.farmId === b.farmId &&
  a.kind === b.kind &&
  !a.error &&
  (a.kind === "milk" && b.kind === "milk"
    ? a.data.record_date === b.data.record_date && a.data.session === b.data.session
    : a.kind === "flock" && b.kind === "flock"
      ? a.data.flock_id === b.data.flock_id && a.data.log_date === b.data.log_date
      : a.kind === "attendance" && b.kind === "attendance"
        ? a.data.date === b.data.date
        : a.kind === "update" && b.kind === "update"
          ? a.data.table === b.data.table && a.data.id === b.data.id
          : a.kind === "animal" && b.kind === "animal" && a.data.id === b.data.id);

/** The id of the row an entry makes (new rows only). */
function made(e: OutboxEntry): { table: string; id: string } | null {
  if (e.kind === "insert") return { table: e.data.table, id: e.data.row.id };
  if (e.kind === "animal" && e.data.isNew) return { table: "cattle", id: e.data.id };
  return null;
}

/** Marks merged: the older entry's values, then the newer one's. */
function mergeMarks(old: { staff_id: string }[], next: { staff_id: string }[], present: string[]) {
  const m = new Map(old.map((r) => [r.staff_id, r]));
  present.forEach((id) => m.delete(id));
  next.forEach((r) => m.set(r.staff_id, r));
  return [...m.values()];
}

export function add(store: Store, e: NewEntry, id: string, now = Date.now()) {
  const list = readAll(store);
  let entry = { ...e, id, createdAt: now, error: null } as OutboxEntry;

  // Changes to (or the deletion of) a row that is itself still waiting go into
  // that entry, so nothing is sent for a row the server never had.
  const target = entry.kind === "update" || entry.kind === "delete" ? { table: entry.data.table, id: entry.data.id } : null;
  const maker = target ? list.find((x) => !x.error && x.farmId === e.farmId && x.userId === e.userId && made(x)?.table === target.table && made(x)?.id === target.id) : undefined;
  if (maker && target) {
    if (entry.kind === "delete") {
      // Never sent: drop it, its changes and anything recorded against it.
      write(store, list.filter((x) => x !== maker && !(x.kind === "update" && x.data.table === target.table && x.data.id === target.id)));
      return entry;
    }
    if (entry.kind === "update") {
      const patch = entry.data.patch;
      const merged =
        maker.kind === "insert"
          ? { ...maker, data: { ...maker.data, row: { ...maker.data.row, ...patch } } }
          : maker.kind === "animal"
            ? { ...maker, data: { ...maker.data, row: { ...maker.data.row, ...patch } } }
            : maker;
      write(store, list.map((x) => (x === maker ? merged : x)));
      return merged;
    }
  }

  const old = list.find((x) => sameSlot(x, e));
  if (old && old.kind === "milk" && entry.kind === "milk") {
    // Cows typed earlier but not now keep their litres.
    const rows = new Map(old.data.rows.map((r) => [r.cattle_id, r]));
    for (const r of entry.data.rows) rows.set(r.cattle_id, r);
    entry = { ...entry, data: { ...entry.data, rows: [...rows.values()], seen: { ...entry.data.seen, ...old.data.seen } } };
  }
  if (old && old.kind === "flock" && entry.kind === "flock" && "seen" in old.data) entry = { ...entry, data: { ...entry.data, seen: old.data.seen } };
  if (old && old.kind === "attendance" && entry.kind === "attendance") {
    const next = entry.data;
    const marks = mergeMarks(old.data.marks, next.marks, next.present) as typeof next.marks;
    const present = [...new Set([...old.data.present.filter((p) => !next.marks.some((m) => m.staff_id === p)), ...next.present])];
    entry = { ...entry, data: { ...next, marks, present, seen: { ...next.seen, ...old.data.seen } } };
  }
  if (old && old.kind === "update" && entry.kind === "update") {
    // The first change's "seen" stays: that is what the server had before.
    entry = { ...entry, data: { ...entry.data, patch: { ...old.data.patch, ...entry.data.patch }, seen: old.data.seen, before: { ...entry.data.before, ...old.data.before } } };
  }
  if (old && old.kind === "animal" && entry.kind === "animal") {
    entry = {
      ...entry,
      data: { ...entry.data, isNew: old.data.isNew, row: { ...old.data.row, ...entry.data.row }, seen: old.data.seen, before: { ...entry.data.before, ...old.data.before }, weight: entry.data.weight ?? old.data.weight, photo: entry.data.photo ?? old.data.photo },
    };
  }
  write(store, [...list.filter((x) => x !== old), entry]);
  return entry;
}

export function remove(store: Store, id: string) {
  write(store, readAll(store).filter((x) => x.id !== id));
}

/** This person's entries, oldest first. */
export const mine = (store: Store, userId: string) => readAll(store).filter((e) => e.userId === userId).sort((a, b) => a.createdAt - b.createdAt);

/**
 * Sends this person's waiting entries in order. Stops at the first connection
 * failure (the rest wait too); an entry the server refuses is marked and skipped.
 */
export async function flush(store: Store, userId: string, send: Sender, onConflict?: (e: OutboxEntry, c: Conflict[]) => void) {
  let sent = 0;
  let failed = 0;
  for (const e of mine(store, userId)) {
    if (e.error) continue;
    const r = await send(e);
    if (!r || "conflicts" in r) {
      remove(store, e.id);
      sent++;
      if (r?.conflicts.length) onConflict?.(e, r.conflicts);
    } else if (r.network) {
      break;
    } else {
      write(store, readAll(store).map((x) => (x.id === e.id ? { ...x, error: r.error } : x)));
      failed++;
    }
  }
  return { sent, failed, waiting: mine(store, userId).filter((e) => !e.error).length };
}
