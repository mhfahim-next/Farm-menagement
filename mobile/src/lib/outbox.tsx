// The outbox on the phone: entries try the server first and wait on the phone
// when there is no internet. They are sent by themselves when the app comes
// back to the front, every half minute while some wait, or with "Send now".
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppState } from "react-native";
import { isNetworkError } from "./entries";
import { ADULT_AFTER_BIRTH } from "./records";
import { add, flush as flushAll, mine, remove, type NewEntry, type OutboxEntry, type Sender, type Store } from "./outbox-core";
import { useSession } from "./session";
import { getItem, setItem } from "./storage";
import { supabase } from "./supabase";

/** An entry as a screen hands it over (the signed-in person is added here). */
export type EntryInput = NewEntry extends infer T ? (T extends unknown ? Omit<T, "userId"> : never) : never;

const KEY = "ff.outbox";
const store: Store = { get: () => getItem(KEY), set: (v) => setItem(KEY, v) };

const send: Sender = async (e) => {
  const { error } = await write(e);
  return error ? { error: error.message, network: isNetworkError(error) } : null;
};

type Result = PromiseLike<{ error: { message: string; name?: string } | null }>;
/** Insert, or nothing when a row with this id is already there (an earlier send that did arrive). */
const once = (table: string, rows: object | object[]) => supabase.from(table).upsert(rows, { onConflict: "id", ignoreDuplicates: true }) as unknown as Result;
const ok = { error: null };

async function write(e: OutboxEntry): Promise<{ error: { message: string; name?: string } | null }> {
  const farm_id = e.farmId;
  switch (e.kind) {
    case "milk":
      return supabase.from("milk_records").upsert(
        e.data.rows.map((r) => ({ farm_id, record_date: e.data.record_date, session: e.data.session, ...r })),
        { onConflict: "cattle_id,record_date,session" },
      );
    case "flock": {
      const { flock_name: _name, ...row } = e.data;
      return supabase.from("flock_daily_logs").upsert({ farm_id, ...row }, { onConflict: "flock_id,log_date" });
    }
    case "health": {
      const { ids, cattle_ids, label: _l, notes, ...rest } = e.data;
      return once(
        "health_records",
        cattle_ids.map((cattle_id, i) => ({ id: ids[i], farm_id, cattle_id, ...rest, medicine: rest.product, description: notes ?? rest.product })),
      );
    }
    case "breeding": {
      const { id, calf_id, calf, label: _l, ...event } = e.data;
      if (calf && calf_id) {
        // The newborn first: if its tag is taken, nothing is saved and the reason is shown.
        const [dam, lastAi] = await Promise.all([
          supabase.from("cattle").select("breed, species").eq("id", event.cattle_id).maybeSingle(),
          supabase
            .from("breeding_events")
            .select("bull_or_semen")
            .eq("cattle_id", event.cattle_id)
            .eq("event_type", "insemination")
            .lte("event_date", event.event_date)
            .order("event_date", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);
        if (dam.error) return dam;
        const r = await once("cattle", {
          id: calf_id,
          farm_id,
          ...calf,
          species: (dam.data as { species: string | null } | null)?.species ?? "cattle",
          breed: (dam.data as { breed: string | null } | null)?.breed ?? null,
          date_of_birth: event.event_date,
          mother_id: event.cattle_id,
          father: (lastAi.data as { bull_or_semen: string | null } | null)?.bull_or_semen ?? null,
        });
        if (r.error) return r;
      }
      const r = await once("breeding_events", { id, farm_id, ...event });
      if (r.error || event.event_type !== "calving") return r;
      // A heifer (young doe, ewe lamb) counts as an adult once she has given birth.
      const { data } = await supabase.from("cattle").select("category").eq("id", event.cattle_id).maybeSingle();
      const adult = data ? ADULT_AFTER_BIRTH[(data as { category: string }).category] : undefined;
      if (adult) await supabase.from("cattle").update({ category: adult }).eq("id", event.cattle_id).eq("farm_id", farm_id);
      return ok;
    }
    case "sale": {
      const { label: _l, ...row } = e.data;
      return once("sales", { farm_id, ...row });
    }
    case "payment": {
      const { label: _l, ...row } = e.data;
      return once("buyer_payments", { farm_id, ...row });
    }
    case "buyer": {
      const { label: _l, ...row } = e.data;
      return once("buyers", { farm_id, ...row });
    }
  }
}

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
