// Keeps the current farm's data on the phone, so every screen opens without
// internet: lists, each animal's page, flocks, stock, staff, sales, money and
// reports. Downloaded when the app opens (at most every few hours), when the
// internet comes back and with "Download now". Records older than the number
// of days a super admin sets on the website (default 365) are not downloaded,
// and saved days older than that are removed from the phone.
import { useCallback, useEffect, useState } from "react";
import { cacheKeys, dropCache, readCache, writeCache } from "./cache";
import {
  fetchAllAnimalDetails,
  fetchAllFlocks,
  fetchAnimalProfit,
  fetchAnimals,
  fetchBuyers,
  fetchCanExport,
  fetchDaily,
  fetchFlockDetail,
  fetchFlocks,
  fetchLedger,
  fetchMonthly,
  fetchOptions,
  fetchRules,
  fetchSales,
  fetchStock,
  fetchTeam,
  fetchToday,
  fetchTransactions,
  isManager,
  minusDays,
  type FlockLog,
  type MilkDay,
  type PaymentRow,
  type SaleRow,
  type StaffMember,
  type StaffPayment,
  type Attendance,
  type StockMove,
} from "./data";
import { farmToday } from "./dates";
import { isNetworkError } from "./entries";
import type { Membership } from "./farm";
import { fetchFattening } from "./fattening-data";
import type { Locale } from "./i18n/core";
import { isOnline, onReconnect } from "./net";
import { addDays, monthRange, shiftMonth } from "./records";
import { fetchReminders } from "./reminders";
import { daysInMonth } from "./staff";
import { supabase } from "./supabase";
import { fetchToolRows } from "./tool-params";

export const DEFAULT_OFFLINE_DAYS = 365;
/** Downloaded again on its own at most this often (each screen also refreshes what it shows). */
const EVERY = 6 * 60 * 60 * 1000;

export type OfflineMeta = { at: number; days: number };
const metaKey = (farmId: string) => `offline.${farmId}`;
export const offlineMeta = (farmId: string) =>
  readCache<OfflineMeta>(metaKey(farmId));

/** How many days of records to keep on the phone (set by a super admin on the website). */
async function fetchOfflineDays() {
  const { data } = await supabase
    .from("system_settings")
    .select("offline_days")
    .eq("id", 1)
    .maybeSingle();
  const v = Number((data as { offline_days?: number } | null)?.offline_days);
  return Number.isInteger(v) && v >= 30 ? v : DEFAULT_OFFLINE_DAYS;
}

async function rowsOf<T>(
  q: PromiseLike<{ data: unknown; error: { message: string } | null }>,
): Promise<T[]> {
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as T[];
}

/** Every row of a query, a thousand at a time. */
async function every<T>(
  page: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: unknown; error: { message: string } | null }>,
) {
  const out: T[] = [];
  for (let start = 0; ; start += 1000) {
    const part = await rowsOf<T>(page(start, start + 999));
    out.push(...part);
    if (part.length < 1000) return out;
  }
}

const group = <T, K extends string>(list: T[], key: (r: T) => K | null) => {
  const m = new Map<K, T[]>();
  for (const r of list) {
    const k = key(r);
    if (k) m.set(k, [...(m.get(k) ?? []), r]);
  }
  return m;
};

/** Months from `from` to `to` ("YYYY-MM"), newest first, at most `max`. */
function months(from: string, to: string, max = 24) {
  const out: string[] = [];
  for (
    let m = to.slice(0, 7);
    m >= from.slice(0, 7) && out.length < max;
    m = shiftMonth(m, -1)
  )
    out.push(m);
  return out;
}

/** Saved copies of days older than the window are removed (they'd only fill the phone). */
function tidy(windowStart: string) {
  for (const k of cacheKeys()) {
    const day =
      /^(?:today|milkday|flocklog|daily|aprofit)\..*?(\d{4}-\d{2}-\d{2})/.exec(
        k,
      )?.[1];
    const month = /^(?:staff|monthly)\.[^.]+\.(\d{4}-\d{2})$/.exec(k)?.[1];
    if ((day && day < windowStart) || (month && `${month}-31` < windowStart))
      dropCache(k);
  }
}

let running: Promise<void> | null = null;

/**
 * Downloads the farm's data into the copies the screens read. Throws when the
 * server can't be reached; a part the server refuses is skipped.
 */
export function downloadFarm(m: Membership, locale: Locale): Promise<void> {
  running ??= run(m, locale).finally(() => {
    running = null;
  });
  return running;
}

async function run({ farm, role }: Membership, locale: Locale) {
  const f = farm.id;
  const today = farmToday();
  const days = await fetchOfflineDays();
  const start = minusDays(today, days);
  const dairy = Boolean(farm.has_dairy);
  const layer = Boolean(farm.has_layer);
  const birds = Boolean(farm.has_layer || farm.has_broiler);
  const animalsFarm = Boolean(
    farm.has_dairy || farm.has_goat || farm.has_fattening,
  );
  const yesterday = addDays(today, -1);
  // Only what this person's screens show: doctors (vets) see no stock, sales, money or reports; staff is for owners and managers.
  const money = role !== "vet";
  const managers = isManager(role);

  // Each part on its own: one the server refuses doesn't stop the rest; no internet stops all.
  const part = async (fn: () => Promise<void>) => {
    try {
      await fn();
    } catch (e) {
      if (isNetworkError(e instanceof Error ? e : new Error(String(e))))
        throw e;
    }
  };
  const keep = <T>(key: string, fetcher: () => Promise<T>) =>
    part(async () => writeCache(key, await fetcher()));

  // Settings and lists every form uses.
  await Promise.all([
    keep("options", fetchOptions),
    keep("breedingRules", fetchRules),
    keep("tool-params", fetchToolRows),
    keep(`export.${farm.plan}`, () => fetchCanExport(farm.plan)),
    keep(`animals.${f}`, () => fetchAnimals(f)),
    ...(money
      ? [
          keep(`buyers.${f}`, () => fetchBuyers(f)),
          keep(`stock.${f}`, () => fetchStock(f)),
        ]
      : []),
    keep(`today.${f}.${today}.${Number(dairy)}${Number(birds)}`, () =>
      fetchToday(f, today, dairy, birds),
    ),
    // From the website, not the database: skipped when only the website is down.
    fetchReminders(f, locale).then(
      (v) => writeCache(`reminders.${f}.${locale}`, v),
      () => {},
    ),
    keep(`team.${f}`, () => fetchTeam(f, isManager(role))),
  ]);

  // Every animal's page.
  if (animalsFarm) {
    await part(async () => {
      const all = await fetchAllAnimalDetails(f, today, start);
      for (const [id, d] of all) writeCache(`animal.${id}`, d);
    });
    if (farm.has_fattening)
      await keep(`fattening.${f}`, () => fetchFattening(f, today));
  }

  // Today's and yesterday's milking sheets ("same as yesterday" works offline too).
  if (dairy) {
    await part(async () => {
      const list = await rowsOf<{
        cattle_id: string;
        record_date: string;
        session: string;
        quantity_liters: number;
        updated_at: string;
      }>(
        supabase
          .from("milk_records")
          .select(
            "cattle_id, record_date, session, quantity_liters, updated_at",
          )
          .eq("farm_id", f)
          .in("record_date", [today, yesterday]),
      );
      const sessions = new Set([
        "morning",
        "evening",
        ...list.map((r) => r.session),
      ]);
      for (const day of [today, yesterday]) {
        for (const s of sessions) {
          const rows = list.filter(
            (r) => r.record_date === day && r.session === s,
          );
          const v: MilkDay = {
            values: Object.fromEntries(
              rows.map((r) => [r.cattle_id, String(Number(r.quantity_liters))]),
            ),
            seen: Object.fromEntries(
              rows.map((r) => [r.cattle_id, r.updated_at]),
            ),
          };
          writeCache(`milkday.${f}.${day}.${s}`, v);
        }
      }
    });
  }

  // Flocks: the lists, each flock's page, and today's and yesterday's log.
  if (birds) {
    await Promise.all([
      keep(`flocks.${f}`, () => fetchFlocks(f)),
      keep(`allFlocks.${f}`, () => fetchAllFlocks(f)),
    ]);
    await part(async () => {
      const flocks = await fetchAllFlocks(f);
      for (const fl of flocks)
        if (fl.status === "active" || fl.placed_date >= start)
          await keep(`flock.${fl.id}`, () => fetchFlockDetail(fl.id));
      const logs = await rowsOf<{
        flock_id: string;
        log_date: string;
        eggs_collected: number;
        eggs_broken: number;
        mortality: number;
        culled: number;
        feed_kg: number | null;
        avg_weight_g: number | null;
        feed_item_id: string | null;
        updated_at: string;
      }>(
        supabase
          .from("flock_daily_logs")
          .select(
            "flock_id, log_date, eggs_collected, eggs_broken, mortality, culled, feed_kg, avg_weight_g, feed_item_id, updated_at",
          )
          .eq("farm_id", f)
          .in("log_date", [today, yesterday]),
      );
      const s = (v: unknown) =>
        v === null || v === undefined ? "" : String(Number(v));
      for (const fl of flocks.filter((x) => x.status === "active")) {
        for (const day of [today, yesterday]) {
          const l = logs.find(
            (x) => x.flock_id === fl.id && x.log_date === day,
          );
          const v: FlockLog | null = l
            ? {
                eggs: s(l.eggs_collected),
                broken: s(l.eggs_broken),
                mortality: s(l.mortality),
                culled: s(l.culled),
                feed: s(l.feed_kg),
                weight: s(l.avg_weight_g),
                feedItem: l.feed_item_id,
                updated_at: l.updated_at,
              }
            : null;
          writeCache(`flocklog.${fl.id}.${day}`, v);
        }
      }
    });
  }

  if (money) await downloadMoney();
  if (managers) await downloadStaff();

  tidy(start);
  writeCache(metaKey(f), { at: Date.now(), days } satisfies OfflineMeta);

  async function downloadMoney() {
    // Sales: the latest list, and each buyer's sales and payments within the window.
    await keep(`sales.${f}`, () => fetchSales(f));
    await part(async () => {
      const [sales, pays] = await Promise.all([
        every<SaleRow>((a, b) =>
          supabase
            .from("sales")
            .select(
              "id, sale_date, product, quantity, unit, amount, paid_amount, buyer_id, cattle_id",
            )
            .eq("farm_id", f)
            .not("buyer_id", "is", null)
            .gte("sale_date", start)
            .order("sale_date", { ascending: false })
            .order("id")
            .range(a, b),
        ),
        every<PaymentRow>((a, b) =>
          supabase
            .from("buyer_payments")
            .select("id, pay_date, amount, method, buyer_id")
            .eq("farm_id", f)
            .gte("pay_date", start)
            .order("pay_date", { ascending: false })
            .order("id")
            .range(a, b),
        ),
      ]);
      const s = group(sales, (r) => r.buyer_id);
      const p = group(pays, (r) => r.buyer_id);
      for (const id of new Set([...s.keys(), ...p.keys()]))
        writeCache(`buyer.${id}`, {
          sales: (s.get(id) ?? []).slice(0, 30),
          payments: (p.get(id) ?? []).slice(0, 30),
        });
    });

    // Stock moves per item.
    await part(async () => {
      const moves = await every<StockMove & { item_id: string }>((a, b) =>
        supabase
          .from("inventory_moves")
          .select(
            "id, item_id, move_date, move_type, quantity, total_cost, supplier, notes, log_id, flock_id",
          )
          .eq("farm_id", f)
          .gte("move_date", start)
          .order("move_date", { ascending: false })
          .order("created_at", { ascending: false })
          .order("id")
          .range(a, b),
      );
      const byItem = group(moves, (m) => m.item_id);
      for (const [id, list] of byItem)
        writeCache(
          `moves.${id}`,
          list.slice(0, 40).map(({ item_id: _i, ...m }) => m),
        );
    });

    // Money this month and last, and the reports.
    for (const which of ["this", "last"] as const) {
      const r = monthRange(today, which);
      await Promise.all([
        keep(`ledger.${f}.${r.from}`, () => fetchLedger(f, r.from, r.to)),
        keep(`txns.${f}.${r.from}`, () => fetchTransactions(f, r.from, r.to)),
      ]);
    }
    const month = today.slice(0, 7);
    await Promise.all([
      keep(`daily.${f}.${today}.${Number(dairy)}${Number(layer)}`, () =>
        fetchDaily(f, addDays(today, -29), today, dairy, layer),
      ),
      keep(`monthly.${f}.${month}`, () =>
        fetchMonthly(
          f,
          `${shiftMonth(month, -5)}-01`,
          `${month}-${String(daysInMonth(month)).padStart(2, "0")}`,
        ),
      ),
      ...(animalsFarm && farm.show_animal_profit !== false
        ? [
            keep(`aprofit.${f}.12m.${today}`, () =>
              fetchAnimalProfit(f, addDays(today, -364), today),
            ),
          ]
        : []),
    ]);
  }

  async function downloadStaff() {
    // Staff: each month in the window (attendance and payments).
    await part(async () => {
      const [staff, attendance, payments] = await Promise.all([
        rowsOf<StaffMember>(
          supabase
            .from("staff")
            .select(
              "id, name, phone, position, module, monthly_salary, join_date, active, notes",
            )
            .eq("farm_id", f)
            .order("active", { ascending: false })
            .order("name"),
        ),
        every<Attendance>((a, b) =>
          supabase
            .from("staff_attendance")
            .select("staff_id, att_date, status, note, updated_at")
            .eq("farm_id", f)
            .gte("att_date", start)
            .order("id")
            .range(a, b),
        ),
        every<StaffPayment>((a, b) =>
          supabase
            .from("staff_payments")
            .select("id, staff_id, pay_month, pay_type, amount, paid_on, note")
            .eq("farm_id", f)
            .gte("pay_month", `${start.slice(0, 7)}-01`)
            .order("paid_on", { ascending: false })
            .order("id")
            .range(a, b),
        ),
      ]);
      if (!staff.length) return;
      for (const m of months(start, today)) {
        writeCache(`staff.${f}.${m}`, {
          staff,
          attendance: attendance.filter((x) => x.att_date.startsWith(m)),
          payments: payments.filter((x) => x.pay_month.startsWith(m)),
        });
      }
    });
  }
}

/**
 * Keeps the current farm downloaded: when the app opens (if the last download
 * is a few hours old), when the internet comes back, and on request.
 */
export function useOfflineDownload(m: Membership | null, locale: Locale) {
  const farmId = m?.farm.id;
  const [state, setState] = useState<{ busy: boolean; error: string | null }>({
    busy: false,
    error: null,
  });

  const download = useCallback(
    async (force = false): Promise<{ ok: boolean; error?: string }> => {
      if (!m || !isOnline()) return { ok: false };
      const meta = offlineMeta(m.farm.id);
      if (!force && meta && Date.now() - meta.at < EVERY) return { ok: true };
      setState({ busy: true, error: null });
      try {
        await downloadFarm(m, locale);
        setState({ busy: false, error: null });
        return { ok: true };
      } catch (e) {
        const error = e instanceof Error ? e.message : String(e);
        setState({ busy: false, error });
        return { ok: false, error };
      }
    },
    [m, locale],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.resolve();
      if (!cancelled) await download();
    })();
    const off = onReconnect(() => void download());
    return () => {
      cancelled = true;
      off();
    };
  }, [download]);

  return { ...state, meta: farmId ? offlineMeta(farmId) : null, download };
}
