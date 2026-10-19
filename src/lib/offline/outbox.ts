// Entries saved on the phone while there is no internet ("outbox"), kept in
// IndexedDB until they are sent. Browser-only; every call fails softly when
// IndexedDB is unavailable (private mode), and callers then fall back to
// saving online only.

export const OUTBOX_KINDS = ["milk", "flock", "stockUse", "attendance"] as const;
export type OutboxKind = (typeof OUTBOX_KINDS)[number];

export type OutboxEntry = {
  id: string;
  kind: OutboxKind;
  /** Short summary shown in the list ("Milk · 19 Oct · morning · 5 cows"). */
  label: string;
  farmId: string;
  farmName: string;
  userId: string;
  /** The form fields, exactly as the online form would send them. */
  fields: [string, string][];
  createdAt: number;
  /** Why the server refused it; such entries wait for the user to discard them. */
  error?: string | null;
};

const DB = "farmflows-offline";
const STORE = "outbox";
export const OUTBOX_EVENT = "farmflows:outbox";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = fn(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

function changed() {
  window.dispatchEvent(new Event(OUTBOX_EVENT));
}

export function newId() {
  return crypto.randomUUID();
}

export async function addEntry(entry: Omit<OutboxEntry, "id" | "createdAt" | "error"> & { id?: string }) {
  const row: OutboxEntry = { ...entry, id: entry.id ?? newId(), createdAt: Date.now(), error: null };
  await run("readwrite", (s) => s.put(row));
  changed();
  return row;
}

/** This user's entries, oldest first (they are sent in the order they were made). */
export async function listEntries(userId: string): Promise<OutboxEntry[]> {
  try {
    const all = await run<OutboxEntry[]>("readonly", (s) => s.getAll());
    return all.filter((e) => e.userId === userId).sort((a, b) => a.createdAt - b.createdAt);
  } catch {
    return [];
  }
}

export async function removeEntry(id: string) {
  await run("readwrite", (s) => s.delete(id));
  changed();
}

export async function markFailed(entry: OutboxEntry, error: string) {
  await run("readwrite", (s) => s.put({ ...entry, error }));
  changed();
}

export function toFormData(entry: OutboxEntry) {
  const fd = new FormData();
  for (const [k, v] of entry.fields) fd.append(k, v);
  return fd;
}

export function fieldsOf(fd: FormData): [string, string][] {
  const out: [string, string][] = [];
  for (const [k, v] of fd.entries()) if (typeof v === "string") out.push([k, v]);
  return out;
}

/** True when a call failed because the server could not be reached (not because it said no). */
export function isNetworkError(e: unknown) {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  return e instanceof TypeError || (e instanceof Error && /fetch|network|load failed|server action/i.test(e.message));
}
