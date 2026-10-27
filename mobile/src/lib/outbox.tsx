// The outbox on the phone: entries try the server first and wait on the phone
// when there is no internet. They are sent by themselves when the app comes
// back to the front, every half minute while some wait, or with "Send now".
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppState } from "react-native";
import { isNetworkError } from "./entries";
import { add, flush as flushAll, mine, remove, type NewEntry, type OutboxEntry, type Sender, type Store } from "./outbox-core";
import { useSession } from "./session";
import { getItem, setItem } from "./storage";
import { supabase } from "./supabase";

/** An entry as a screen hands it over (the signed-in person is added here). */
export type EntryInput = NewEntry extends infer T ? (T extends unknown ? Omit<T, "userId"> : never) : never;

const KEY = "ff.outbox";
const store: Store = { get: () => getItem(KEY), set: (v) => setItem(KEY, v) };

const send: Sender = async (e) => {
  const { error } =
    e.kind === "milk"
      ? await supabase.from("milk_records").upsert(
          e.data.rows.map((r) => ({ farm_id: e.farmId, record_date: e.data.record_date, session: e.data.session, ...r })),
          { onConflict: "cattle_id,record_date,session" },
        )
      : await supabase.from("flock_daily_logs").upsert(
          (({ flock_name: _name, ...row }) => ({ farm_id: e.farmId, ...row }))(e.data),
          { onConflict: "flock_id,log_date" },
        );
  return error ? { error: error.message, network: isNetworkError(error) } : null;
};

export type SaveResult = { status: "saved" } | { status: "queued" } | { status: "error"; error: string };

type OutboxState = {
  entries: OutboxEntry[];
  waiting: number;
  syncing: boolean;
  /** Save now, or keep it on the phone when there is no internet. */
  save: (e: EntryInput) => Promise<SaveResult>;
  sync: () => Promise<void>;
  discard: (id: string) => void;
};

const Ctx = createContext<OutboxState | null>(null);
const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export function OutboxProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const userId = session?.user.id ?? null;
  const [entries, setEntries] = useState<OutboxEntry[]>(() => (userId ? mine(store, userId) : []));
  const [syncing, setSyncing] = useState(false);
  const busy = useRef(false);

  const refresh = useCallback(() => setEntries(userId ? mine(store, userId) : []), [userId]);

  const sync = useCallback(async () => {
    if (!userId || busy.current) return;
    busy.current = true;
    setSyncing(true);
    try {
      await flushAll(store, userId, send);
    } catch {
      // stays waiting; tried again later
    } finally {
      busy.current = false;
      setSyncing(false);
      refresh();
    }
  }, [userId, refresh]);

  const waiting = entries.filter((e) => !e.error).length;

  // Send on start and whenever the app comes back to the front.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.resolve();
      if (!cancelled) await sync();
    })();
    const sub = AppState.addEventListener("change", (s) => s === "active" && sync());
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, [sync]);

  // While something waits, try again every half minute.
  useEffect(() => {
    if (!waiting) return;
    const timer = setInterval(sync, 30_000);
    return () => clearInterval(timer);
  }, [waiting, sync]);

  const value = useMemo<OutboxState>(
    () => ({
      entries,
      waiting,
      syncing,
      save: async (e) => {
        if (!userId) return { status: "error", error: "signed out" };
        const entry = { ...e, userId, id: newId(), createdAt: Date.now() } as OutboxEntry;
        // Older waiting entries go first, so a newer save isn't overwritten by them later.
        const pending = mine(store, userId).some((x) => !x.error);
        const r = pending ? { error: "waiting", network: true } : await send(entry).catch((err: Error) => ({ error: err.message, network: true }));
        if (!r) return { status: "saved" };
        if (!r.network) return { status: "error", error: r.error };
        add(store, { ...e, userId } as NewEntry, entry.id);
        refresh();
        if (pending) sync();
        return { status: "queued" };
      },
      sync,
      discard: (id) => {
        remove(store, id);
        refresh();
      },
    }),
    [entries, waiting, syncing, userId, sync, refresh],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOutbox() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useOutbox outside OutboxProvider");
  return v;
}
