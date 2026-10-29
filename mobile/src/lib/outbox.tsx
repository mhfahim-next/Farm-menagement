// The outbox on the phone: entries try the server first and wait on the phone
// when there is no internet. They are sent by themselves as soon as the
// connection is back, when the app comes back to the front, every half minute
// while some wait, or with "Send now". Every new row gets its id on the phone,
// so an entry sent twice (the reply lost on a weak network) is saved once.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppState } from "react-native";
import { isNetworkError } from "./entries";
import { farmToday } from "./dates";
import { isOnline, onReconnect } from "./net";
import { cancelEvening } from "./notify";
import { dropKeptPhoto, removePhoto, uploadPhoto } from "./photos";
import { ADULT_AFTER_BIRTH } from "./records";
import { add, changedFields, decide, flush as flushAll, mine, remove, readAll, type Conflict, type DeleteTable, type NewEntry, type OutboxEntry, type Row, type Sender } from "./outbox-core";
import { addNotes, notifySynced, setOutboxUser, store, useMyEntries } from "./outbox-store";
import { useSession } from "./session";
import { supabase } from "./supabase";

/** An entry as a screen hands it over (the signed-in person is added here). */
export type EntryInput = NewEntry extends infer T ? (T extends unknown ? Omit<T, "userId"> : never) : never;

type Err = { message: string; name?: string };
type Written = { error: Err | null; conflicts?: Conflict[] };

const send: Sender = async (e) => {
  const { error, conflicts } = await write(e);
  if (error) return { error: error.message, network: isNetworkError(error) };
  return conflicts?.length ? { conflicts } : null;
};

type Result = PromiseLike<{ error: Err | null }>;
/** Insert, or nothing when a row with this id is already there (an earlier send that did arrive). */
const once = (table: string, rows: object | object[]) => supabase.from(table).upsert(rows, { onConflict: "id", ignoreDuplicates: true }) as unknown as Result;
const ok = { error: null };

/** True when the server row already holds these values (an earlier send arrived, or the same was typed elsewhere). */
const same = (server: Row, mine: Row) => Object.entries(mine).every(([k, v]) => String(server[k] ?? null) === String(v ?? null));

type Stamped = Row & { updated_at: string };

/**
 * Changes one row, unless the server has a newer change to the same fields
 * (last change wins). Changes made elsewhere to other fields are kept.
 */
async function update(table: string, id: string, patch: Row, seen: string | null | undefined, made: number, label: string, before?: Row): Promise<Written> {
  const cols = ["updated_at", ...Object.keys(patch)].join(", ");
  const cur = await supabase.from(table).select(cols).eq("id", id).maybeSingle();
  if (cur.error) return cur;
  const row = cur.data as unknown as Stamped | null;
  // Deleted on the server meanwhile: nothing to change.
  if (!row) return { error: null, conflicts: [{ label, kept: "gone" }] };
  if (same(row, patch)) return ok;
  // Changed elsewhere, but not these fields: no conflict.
  const untouched = before && changedFields(patch, row, before).length === 0;
  const d = untouched ? "write" : decide(row.updated_at, seen, made);
  if (d === "keep") return { error: null, conflicts: [{ label, kept: "theirs" }] };
  const r = await supabase.from(table).update(patch).eq("id", id);
  if (r.error) return r;
  return d === "replace" ? { error: null, conflicts: [{ label, kept: "mine" }] } : ok;
}

async function write(e: OutboxEntry): Promise<Written> {
  const farm_id = e.farmId;
  switch (e.kind) {
    case "milk": {
      const { record_date, session, rows, seen } = e.data;
      const cur = await supabase
        .from("milk_records")
        .select("cattle_id, quantity_liters, updated_at")
        .eq("farm_id", farm_id)
        .eq("record_date", record_date)
        .eq("session", session)
        .in("cattle_id", rows.map((r) => r.cattle_id));
      if (cur.error) return cur;
      const server = new Map(((cur.data ?? []) as { cattle_id: string; quantity_liters: number; updated_at: string }[]).map((r) => [r.cattle_id, r]));
      let kept = 0;
      let replaced = 0;
      const send = rows.filter((r) => {
        const s = server.get(r.cattle_id);
        if (s && Number(s.quantity_liters) === Number(r.quantity_liters)) return false;
        const d = decide(s?.updated_at ?? null, seen ? (seen[r.cattle_id] ?? null) : undefined, e.createdAt);
        if (d === "keep") kept++;
        if (d === "replace") replaced++;
        return d !== "keep";
      });
      if (send.length) {
        const r = await supabase.from("milk_records").upsert(
          send.map((x) => ({ farm_id, record_date, session, ...x })),
          { onConflict: "cattle_id,record_date,session" },
        );
        if (r.error) return r;
      }
      const label = `milk|${record_date}|${session}`;
      return {
        error: null,
        conflicts: [...(kept ? [{ label, kept: "theirs" as const, n: kept }] : []), ...(replaced ? [{ label, kept: "mine" as const, n: replaced }] : [])],
      };
    }
    case "flock": {
      const { flock_name, seen, ...row } = e.data;
      const cur = await supabase
        .from("flock_daily_logs")
        .select("eggs_collected, eggs_broken, mortality, culled, feed_kg, avg_weight_g, feed_item_id, updated_at")
        .eq("flock_id", row.flock_id)
        .eq("log_date", row.log_date)
        .maybeSingle();
      if (cur.error) return cur;
      const s = cur.data as Stamped | null;
      const { flock_id: _f, log_date: _d, ...values } = row;
      if (s && same(s, values)) return ok;
      const d = decide(s?.updated_at ?? null, seen, e.createdAt);
      const label = `flock|${flock_name}|${row.log_date}`;
      if (d === "keep") return { error: null, conflicts: [{ label, kept: "theirs" }] };
      const r = await supabase.from("flock_daily_logs").upsert({ farm_id, ...row }, { onConflict: "flock_id,log_date" });
      if (r.error) return r;
      return d === "replace" ? { error: null, conflicts: [{ label, kept: "mine" }] } : ok;
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
    case "txn": {
      const { label: _l, ...row } = e.data;
      return once("transactions", { farm_id, ...row });
    }
    case "insert":
      return once(e.data.table, { farm_id, ...e.data.row });
    case "update":
      return update(e.data.table, e.data.id, e.data.patch, e.data.seen, e.createdAt, e.data.label, e.data.before);
    case "delete": {
      // Already gone is fine (deleted elsewhere, or an earlier send arrived).
      const r = await supabase.from(e.data.table).delete().eq("id", e.data.id).eq("farm_id", farm_id);
      if (!r.error && e.data.table === "cattle") await removePhoto("animal-photos", e.data.photo);
      return r;
    }
    case "animal": {
      const { id, isNew, row, seen, before, photo, weight, label } = e.data;
      let conflicts: Conflict[] = [];
      if (isNew) {
        const r = await once("cattle", { id, farm_id, ...row });
        if (r.error) return r;
        if (weight) {
          const w = await once("cattle_weights", { farm_id, cattle_id: id, ...weight });
          if (w.error) return w;
        }
      } else if (Object.keys(row).length) {
        const r = await update("cattle", id, row, seen, e.createdAt, label, before);
        if (r.error) return r;
        conflicts = r.conflicts ?? [];
        // The animal was deleted elsewhere: its photo is not sent.
        if (conflicts.some((c) => c.kept === "gone")) {
          dropKeptPhoto(photo?.uri);
          return { error: null, conflicts };
        }
      }
      if (photo) {
        // Named after the entry, so sending again replaces the same file.
        let path: string | null = null;
        try {
          path = photo.uri ? await uploadPhoto("animal-photos", farm_id, photo.uri, e.id) : null;
        } catch (err) {
          return { error: { message: err instanceof Error ? err.message : String(err), name: (err as Error)?.name } };
        }
        const r = await supabase.from("cattle").update({ photo_path: path }).eq("id", id);
        if (r.error) return r;
        if (photo.old && photo.old !== path) await removePhoto("animal-photos", photo.old);
        dropKeptPhoto(photo.uri);
      }
      return { error: null, conflicts };
    }
    case "attendance": {
      const { date, marks, present, seen, label } = e.data;
      const ids = [...marks.map((m) => m.staff_id), ...present];
      if (!ids.length) return ok;
      const cur = await supabase.from("staff_attendance").select("staff_id, status, note, updated_at").eq("farm_id", farm_id).eq("att_date", date).in("staff_id", ids);
      if (cur.error) return cur;
      const server = new Map(((cur.data ?? []) as (Stamped & { staff_id: string })[]).map((r) => [r.staff_id, r]));
      let kept = 0;
      let replaced = 0;
      const check = (staff: string, mineRow: Row | null) => {
        const s = server.get(staff);
        if (mineRow ? s && same(s, mineRow) : !s) return false;
        const d = decide(s?.updated_at ?? null, seen ? (seen[staff] ?? null) : undefined, e.createdAt);
        if (d === "keep") kept++;
        if (d === "replace") replaced++;
        return d !== "keep";
      };
      const up = marks.filter((m) => check(m.staff_id, { status: m.status, note: m.note }));
      const back = present.filter((p) => check(p, null));
      if (back.length) {
        const r = await supabase.from("staff_attendance").delete().eq("farm_id", farm_id).eq("att_date", date).in("staff_id", back);
        if (r.error) return r;
      }
      if (up.length) {
        const r = await supabase.from("staff_attendance").upsert(
          up.map((m) => ({ farm_id, att_date: date, ...m })),
          { onConflict: "staff_id,att_date" },
        );
        if (r.error) return r;
      }
      return {
        error: null,
        conflicts: [...(kept ? [{ label, kept: "theirs" as const, n: kept }] : []), ...(replaced ? [{ label, kept: "mine" as const, n: replaced }] : [])],
      };
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

/** A save that gets no answer in this time waits on the phone instead (sending it again is safe). */
const PATIENCE = 12_000;
const slow = () => new Promise<{ error: string; network: true }>((resolve) => setTimeout(() => resolve({ error: "timeout", network: true }), PATIENCE));

export function OutboxProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const userId = session?.user.id ?? null;
  // Whose entries: set before the first render that reads them, so a reopened app shows what waits.
  setOutboxUser(userId);
  const entries = useMyEntries();
  const [syncing, setSyncing] = useState(false);
  const busy = useRef(false);

  const sync = useCallback(async () => {
    if (!userId || busy.current || !isOnline()) return;
    busy.current = true;
    setSyncing(true);
    try {
      const r = await flushAll(store, userId, send, addNotes);
      if (r.sent) notifySynced();
    } catch {
      // stays waiting; tried again later
    } finally {
      busy.current = false;
      setSyncing(false);
    }
  }, [userId]);

  const waiting = entries.filter((e) => !e.error).length;

  // Send on start, as soon as the internet is back and whenever the app comes back to the front.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.resolve();
      if (!cancelled) await sync();
    })();
    const sub = AppState.addEventListener("change", (s) => s === "active" && sync());
    const off = onReconnect(() => void sync());
    return () => {
      cancelled = true;
      sub.remove();
      off();
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
        const r =
          pending || !isOnline()
            ? { error: "waiting", network: true }
            : await Promise.race([send(entry), slow()]).catch((err: Error) => ({ error: err.message, network: true }));
        const failed = r && "error" in r ? r : null;
        // Today's milk or eggs are in: no "not entered yet" note tonight.
        const today = farmToday();
        if ((!failed || failed.network) && ((e.kind === "milk" && e.data.record_date === today) || (e.kind === "flock" && e.data.log_date === today))) cancelEvening();
        if (!failed) {
          if (r && "conflicts" in r) addNotes(entry, r.conflicts);
          return { status: "saved" };
        }
        if (!failed.network) return { status: "error", error: failed.error };
        add(store, { ...e, userId } as NewEntry, entry.id, entry.createdAt);
        if (pending) sync();
        return { status: "queued" };
      },
      sync,
      discard: (id) => {
        const e = readAll(store).find((x) => x.id === id);
        if (e?.kind === "animal") dropKeptPhoto(e.data.photo?.uri);
        remove(store, id);
      },
    }),
    [entries, waiting, syncing, userId, sync],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOutbox() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useOutbox outside OutboxProvider");
  return v;
}

/**
 * Deletes a saved record (or keeps the deletion on the phone until it can be
 * sent). Returns the server's reason when it refuses, else null; `queued`
 * tells whether it waits.
 */
export function useRemove() {
  const { save } = useOutbox();
  const farmId = useSession().current?.farm.id;
  return useCallback(
    async (table: DeleteTable, id: string, label: string) => {
      if (!farmId) return { error: "no farm", queued: false };
      const r = await save({ kind: "delete", farmId, data: { table, id, label } });
      return { error: r.status === "error" ? r.error : null, queued: r.status === "queued" };
    },
    [save, farmId],
  );
}
