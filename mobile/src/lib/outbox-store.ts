// Where the outbox lives on the phone, and a signal when it changes: screens
// show waiting entries in their lists at once (see overlay.ts), before the
// server has them.
import { useSyncExternalStore } from "react";
import { mine, type Conflict, type OutboxEntry, type Store, type SyncNote } from "./outbox-core";
import { getItem, setItem } from "./storage";

const KEY = "ff.outbox";
const NOTES = "ff.syncNotes";

let version = 0;
const listeners = new Set<() => void>();
const changed = () => {
  version++;
  listeners.forEach((f) => f());
};

export const store: Store = {
  get: () => getItem(KEY),
  set: (v) => {
    setItem(KEY, v);
    changed();
  },
};

let user: string | null = null;
/** Whose entries the screens show (set by the outbox provider). */
export function setOutboxUser(id: string | null) {
  if (id === user) return;
  user = id;
  // Called while rendering: what is read now is already new, others hear right after.
  version++;
  queueMicrotask(() => listeners.forEach((f) => f()));
}

export const subscribe = (f: () => void) => {
  listeners.add(f);
  return () => {
    listeners.delete(f);
  };
};

let memo: { version: number; list: OutboxEntry[] } = { version: -1, list: [] };
/** The signed-in person's entries still to send (not the refused ones), oldest first. */
export function pendingEntries(): OutboxEntry[] {
  if (memo.version !== version) memo = { version, list: user ? mine(store, user).filter((e) => !e.error) : [] };
  return memo.list;
}

export const usePending = () => useSyncExternalStore(subscribe, pendingEntries, pendingEntries);

let allMemo: { version: number; list: OutboxEntry[] } = { version: -1, list: [] };
/** All of the signed-in person's entries, the refused ones too. */
export function myEntries(): OutboxEntry[] {
  if (allMemo.version !== version) allMemo = { version, list: user ? mine(store, user) : [] };
  return allMemo.list;
}

export const useMyEntries = () => useSyncExternalStore(subscribe, myEntries, myEntries);

// ---- Entries just sent: screens load the server's copy again (it now has them) ----

const synced = new Set<() => void>();
export function onSynced(f: () => void) {
  synced.add(f);
  return () => {
    synced.delete(f);
  };
}
export const notifySynced = () => synced.forEach((f) => f());

// ---- Notes about changes that met another change on the server ----

function readNotes(): SyncNote[] {
  try {
    const v = JSON.parse(getItem(NOTES) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function addNotes(e: OutboxEntry, conflicts: Conflict[]) {
  const at = Date.now();
  const next = conflicts.map((c, i) => ({ ...c, id: `${e.id}-${i}`, userId: e.userId, farmId: e.farmId, at }));
  // The latest 30 are enough.
  setItem(NOTES, JSON.stringify([...readNotes(), ...next].slice(-30)));
  changed();
}

let notesMemo: { version: number; list: SyncNote[] } = { version: -1, list: [] };
export function notes(): SyncNote[] {
  if (notesMemo.version !== version) notesMemo = { version, list: user ? readNotes().filter((n) => n.userId === user) : [] };
  return notesMemo.list;
}

export const useNotes = () => useSyncExternalStore(subscribe, notes, notes);

export function dismissNotes(ids: string[]) {
  setItem(NOTES, JSON.stringify(readNotes().filter((n) => !ids.includes(n.id))));
  changed();
}
