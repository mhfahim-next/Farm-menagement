// Entries saved on the phone while there is no internet ("outbox"), sent in
// the order they were made once the connection is back. Kept in the phone's
// storage, so they survive closing the app. Pure (storage and sending are
// passed in) so the rules are unit-tested.
import type { FlockEntry, MilkEntry } from "./entries";
import type { BreedingEntry, BuyerEntry, HealthEntry, PaymentEntry, SaleEntry, TxnEntry } from "./records";

/** A short description saved with the entry ("Vaccination · FMD · 3 animals"), shown while it waits. */
type Labelled = { label: string };

export type OutboxEntry = {
  id: string;
  farmId: string;
  userId: string;
  createdAt: number;
  /** Why the server refused it; such entries wait for the person to discard them. */
  error?: string | null;
} & (
  | { kind: "milk"; data: MilkEntry }
  | { kind: "flock"; data: FlockEntry & { flock_name: string } }
  // Rows get their ids on the phone, so sending twice (connection lost after
  // the server saved) never makes a second copy.
  | { kind: "health"; data: HealthEntry & Labelled & { ids: string[] } }
  | { kind: "breeding"; data: BreedingEntry & Labelled & { id: string; calf_id: string | null } }
  | { kind: "sale"; data: SaleEntry & Labelled & { id: string } }
  | { kind: "payment"; data: PaymentEntry & Labelled & { id: string } }
  | { kind: "buyer"; data: BuyerEntry & Labelled }
  | { kind: "txn"; data: TxnEntry & Labelled & { id: string } }
);

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
export type NewEntry = DistributiveOmit<OutboxEntry, "id" | "createdAt" | "error">;

export type Store = { get(): string | null; set(v: string): void };
/** Sends one entry: null when saved, else the error and whether it was the connection. */
export type Sender = (e: OutboxEntry) => Promise<{ error: string; network: boolean } | null>;

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
  (a.kind === "milk" && b.kind === "milk"
    ? a.data.record_date === b.data.record_date && a.data.session === b.data.session
    : a.kind === "flock" && b.kind === "flock" && a.data.flock_id === b.data.flock_id && a.data.log_date === b.data.log_date);

export function add(store: Store, e: NewEntry, id: string, now = Date.now()) {
  const list = readAll(store);
  const old = list.find((x) => sameSlot(x, e));
  let entry = { ...e, id, createdAt: now, error: null } as OutboxEntry;
  if (old && old.kind === "milk" && entry.kind === "milk") {
    // Cows typed earlier but not now keep their litres.
    const rows = new Map(old.data.rows.map((r) => [r.cattle_id, r]));
    for (const r of entry.data.rows) rows.set(r.cattle_id, r);
    entry = { ...entry, data: { ...entry.data, rows: [...rows.values()] } };
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
export async function flush(store: Store, userId: string, send: Sender) {
  let sent = 0;
  let failed = 0;
  for (const e of mine(store, userId)) {
    if (e.error) continue;
    const r = await send(e);
    if (!r) {
      remove(store, e.id);
      sent++;
    } else if (r.network) {
      break;
    } else {
      write(store, readAll(store).map((x) => (x.id === e.id ? { ...x, error: r.error } : x)));
      failed++;
    }
  }
  return { sent, failed, waiting: mine(store, userId).filter((e) => !e.error).length };
}
