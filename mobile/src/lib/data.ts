// What the app reads from the server, with the person's own session (row-level security applies).
import { useCached } from "./cache";
import type { OptionRow } from "./options";
import { DEFAULT_RULES, type BreedingRules } from "./records";
import { daysInMonth, type AttendanceStatus } from "./staff";
import type { AnimalProfitData } from "./animal-profit";
import type { MonthSummary } from "./profit";
import { supabase } from "./supabase";

export type Animal = {
  id: string;
  tag_number: string;
  name: string | null;
  breed: string | null;
  category: string;
  status: string;
  species: string | null;
  date_of_birth: string | null;
  is_fattening: boolean;
  sex: string | null;
  photo_path: string | null;
};

export type Flock = { id: string; name: string; kind: "layer" | "broiler" | "sonali"; breed: string | null; birds: number };

async function rows<T>(q: PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<T[]> {
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as T[];
}

export const fetchOptions = () =>
  rows<OptionRow>(supabase.from("dropdown_options").select("list_key, value, label_en, label_bn, meta, active, sort_order").order("sort_order"));

export const fetchAnimals = (farmId: string) =>
  rows<Animal>(
    supabase
      .from("cattle")
      .select("id, tag_number, name, breed, category, status, species, date_of_birth, is_fattening, sex, photo_path")
      .eq("farm_id", farmId)
      .is("deleted_at", null)
      .order("tag_number"),
  );

export async function fetchFlocks(farmId: string): Promise<Flock[]> {
  const [flocks, stats] = await Promise.all([
    rows<Omit<Flock, "birds">>(
      supabase.from("flocks").select("id, name, kind, breed").eq("farm_id", farmId).eq("status", "active").is("deleted_at", null).order("name"),
    ),
    rows<{ flock_id: string; current_count: number }>(supabase.from("flock_stats").select("flock_id, current_count").eq("farm_id", farmId)),
  ]);
  const count = new Map(stats.map((s) => [s.flock_id, Number(s.current_count)]));
  return flocks.map((f) => ({ ...f, birds: count.get(f.id) ?? 0 }));
}

export const useOptions = () => useCached("options", fetchOptions).data;
export const useAnimals = (farmId: string | undefined) => useCached(farmId ? `animals.${farmId}` : null, () => fetchAnimals(farmId!));
export const useFlocks = (farmId: string | undefined) => useCached(farmId ? `flocks.${farmId}` : null, () => fetchFlocks(farmId!));

export type Buyer = { id: string; name: string; phone: string | null; milk_rate: number | null; egg_rate: number | null; due: number; last_sale: string | null };

export const fetchBuyers = (farmId: string) =>
  rows<Buyer>(
    supabase.from("buyer_balances").select("id, name, phone, milk_rate, egg_rate, due, last_sale").eq("farm_id", farmId).eq("archived", false).order("name"),
  );

export const fetchRules = async (): Promise<BreedingRules> => {
  const { data, error } = await supabase
    .from("system_settings")
    .select("gestation_days, heat_cycle_days, goat_gestation_days, sheep_gestation_days")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return { ...DEFAULT_RULES, ...Object.fromEntries(Object.entries(data ?? {}).filter(([, v]) => v !== null)) } as BreedingRules;
};

export const useBuyers = (farmId: string | undefined) => useCached(farmId ? `buyers.${farmId}` : null, () => fetchBuyers(farmId!));
export const useRules = () => useCached("breedingRules", fetchRules).data;

/** Owners, managers and workers enter records; vets see them (their changes go through the farm's approval on the website). */
export const isStaff = (role: string | undefined) => role === "owner" || role === "manager" || role === "worker";

export type SaleRow = { id: string; sale_date: string; product: string; quantity: number; unit: string; amount: number; paid_amount: number; buyer_id: string | null; cattle_id: string | null };
export type PaymentRow = { id: string; pay_date: string; amount: number; method: string; buyer_id: string };

/** The latest sales (and payments, for one buyer). */
export async function fetchSales(farmId: string, buyerId?: string) {
  let sales = supabase
    .from("sales")
    .select("id, sale_date, product, quantity, unit, amount, paid_amount, buyer_id, cattle_id")
    .eq("farm_id", farmId)
    .order("sale_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(30);
  if (buyerId) sales = sales.eq("buyer_id", buyerId);
  const [s, p] = await Promise.all([
    rows<SaleRow>(sales),
    buyerId
      ? rows<PaymentRow>(
          supabase.from("buyer_payments").select("id, pay_date, amount, method, buyer_id").eq("farm_id", farmId).eq("buyer_id", buyerId).order("pay_date", { ascending: false }).limit(30),
        )
      : Promise.resolve([] as PaymentRow[]),
  ]);
  return { sales: s, payments: p };
}

/** Money in and out (the website's ledger: sales, costs, medicine, salaries…) between two dates. */
export const fetchLedger = (farmId: string, from: string, to: string) =>
  rows<{ txn_type: string; module: string | null; amount: number; category: string | null }>(
    supabase.from("finance_ledger").select("txn_type, module, amount, category").eq("farm_id", farmId).gte("txn_date", from).lte("txn_date", to),
  );

/** A database refusal in the reader's words when we know it (duplicate tag, plan limit), else null. */
export function knownDbError(message: string): { key: "animal.err.dupTag" | "plan.err.limit"; n?: number } | null {
  if (/duplicate key|23505|unique/i.test(message)) return { key: "animal.err.dupTag" };
  const limit = /PLAN_LIMIT:\w+:(\d+)/.exec(message);
  if (limit) return { key: "plan.err.limit", n: Number(limit[1]) };
  return null;
}

/** Owners and managers may delete records (the database allows only them). */
export const isManager = (role: string | undefined) => role === "owner" || role === "manager";

/** Deletes one saved record; the error text when the server refuses. */
export async function deleteRow(table: "health_records" | "breeding_events" | "sales" | "buyer_payments" | "transactions" | "cattle_weights" | "flock_health_records", id: string) {
  const { error } = await supabase.from(table).delete().eq("id", id);
  return error?.message ?? null;
}

export type TxnRow = { id: string; txn_date: string; txn_type: string; module: string; category: string; amount: number; description: string | null };

/** Money in and out typed in by hand (not sales or medicine), newest first. */
export const fetchTransactions = (farmId: string, from: string, to: string) =>
  rows<TxnRow>(
    supabase
      .from("transactions")
      .select("id, txn_date, txn_type, module, category, amount, description")
      .eq("farm_id", farmId)
      .gte("txn_date", from)
      .lte("txn_date", to)
      .order("txn_date", { ascending: false })
      .limit(50),
  );

export type FlockRow = {
  id: string;
  name: string;
  kind: "layer" | "broiler" | "sonali";
  breed: string | null;
  shed: string | null;
  status: string;
  placed_date: string;
  initial_count: number;
  age_at_placement_weeks: number;
  chick_price: number | null;
  current_count: number;
};

/** Every flock and batch (active first), with live birds. */
export async function fetchAllFlocks(farmId: string): Promise<FlockRow[]> {
  const [flocks, stats] = await Promise.all([
    rows<Omit<FlockRow, "current_count">>(
      supabase
        .from("flocks")
        .select("id, name, kind, breed, shed, status, placed_date, initial_count, age_at_placement_weeks, chick_price")
        .eq("farm_id", farmId)
        .is("deleted_at", null)
        .order("placed_date", { ascending: false }),
    ),
    rows<{ flock_id: string; current_count: number }>(supabase.from("flock_stats").select("flock_id, current_count").eq("farm_id", farmId)),
  ]);
  const live = new Map(stats.map((s) => [s.flock_id, Number(s.current_count)]));
  return flocks.map((f) => ({ ...f, current_count: live.get(f.id) ?? f.initial_count })).sort((a, b) => Number(a.status !== "active") - Number(b.status !== "active"));
}

export type FlockDetail = {
  flock: FlockRow | null;
  logs: { log_date: string; eggs_collected: number; eggs_broken: number; mortality: number; culled: number; feed_kg: number | null; avg_weight_g: number | null }[];
  health: { id: string; record_date: string; record_type: string; product: string | null; next_due_date: string | null; cost: number | null }[];
  sold: { birds: number; kg: number; amount: number };
  feedCost: number;
};

export async function fetchFlockDetail(id: string): Promise<FlockDetail> {
  const [f, logs, health, stats, moves] = await Promise.all([
    supabase.from("flocks").select("id, name, kind, breed, shed, status, placed_date, initial_count, age_at_placement_weeks, chick_price").eq("id", id).maybeSingle(),
    supabase.from("flock_daily_logs").select("log_date, eggs_collected, eggs_broken, mortality, culled, feed_kg, avg_weight_g").eq("flock_id", id).order("log_date"),
    supabase.from("flock_health_records").select("id, record_date, record_type, product, next_due_date, cost").eq("flock_id", id).order("record_date", { ascending: false }),
    supabase.from("flock_stats").select("current_count, total_sold, total_sold_kg, total_sales").eq("flock_id", id).maybeSingle(),
    supabase.from("inventory_moves").select("item_id, quantity").eq("flock_id", id).eq("move_type", "use"),
  ]);
  const err = f.error ?? logs.error ?? health.error;
  if (err) throw new Error(err.message);
  const s = stats.data as { current_count: number; total_sold: number; total_sold_kg: number; total_sales: number } | null;
  // Feed taken from stock for this flock, at each item's average cost.
  const mv = (moves.data ?? []) as { item_id: string; quantity: number }[];
  const items = mv.length ? await supabase.from("inventory_stock").select("id, avg_cost").in("id", [...new Set(mv.map((m) => m.item_id))]) : { data: [] };
  const cost = new Map(((items.data ?? []) as { id: string; avg_cost: number | null }[]).map((i) => [i.id, Number(i.avg_cost ?? 0)]));
  return {
    flock: f.data ? { ...(f.data as Omit<FlockRow, "current_count">), current_count: Number(s?.current_count ?? (f.data as FlockRow).initial_count) } : null,
    logs: (logs.data ?? []) as FlockDetail["logs"],
    health: (health.data ?? []) as FlockDetail["health"],
    sold: { birds: Number(s?.total_sold ?? 0), kg: Number(s?.total_sold_kg ?? 0), amount: Number(s?.total_sales ?? 0) },
    feedCost: mv.reduce((sum, m) => sum + Number(m.quantity) * (cost.get(m.item_id) ?? 0), 0),
  };
}

export type StockItem = {
  id: string;
  name: string;
  kind: string;
  unit: string;
  unit_kg: number | null;
  module: string;
  low_stock: number | null;
  notes: string | null;
  archived: boolean;
  on_hand: number;
  avg_cost: number | null;
  used_30d: number;
  last_purchase: string | null;
};

export const fetchStock = (farmId: string) =>
  rows<StockItem>(
    supabase
      .from("inventory_stock")
      .select("id, name, kind, unit, unit_kg, module, low_stock, notes, archived, on_hand, avg_cost, used_30d, last_purchase")
      .eq("farm_id", farmId)
      .order("name"),
  );

export type StockMove = { id: string; move_date: string; move_type: string; quantity: number; total_cost: number | null; supplier: string | null; notes: string | null; log_id: string | null; flock_id: string | null };

export const fetchMoves = (itemId: string) =>
  rows<StockMove>(
    supabase
      .from("inventory_moves")
      .select("id, move_date, move_type, quantity, total_cost, supplier, notes, log_id, flock_id")
      .eq("item_id", itemId)
      .order("move_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(40),
  );

export const useStock = (farmId: string | undefined) => useCached(farmId ? `stock.${farmId}` : null, () => fetchStock(farmId!));

export type StaffMember = { id: string; name: string; phone: string | null; position: string | null; module: string; monthly_salary: number; join_date: string; active: boolean; notes: string | null };
export type Attendance = { staff_id: string; att_date: string; status: AttendanceStatus; note: string | null; updated_at?: string | null };
export type StaffPayment = { id: string; staff_id: string; pay_month: string; pay_type: "salary" | "advance" | "bonus"; amount: number; paid_on: string; note: string | null };

/** Everyone on the farm's staff list, with one month's attendance marks and payments. */
export async function fetchStaffMonth(farmId: string, month: string) {
  const last = `${month}-${String(daysInMonth(month)).padStart(2, "0")}`;
  const [staff, attendance, payments] = await Promise.all([
    rows<StaffMember>(supabase.from("staff").select("id, name, phone, position, module, monthly_salary, join_date, active, notes").eq("farm_id", farmId).order("active", { ascending: false }).order("name")),
    rows<Attendance>(supabase.from("staff_attendance").select("staff_id, att_date, status, note, updated_at").eq("farm_id", farmId).gte("att_date", `${month}-01`).lte("att_date", last)),
    rows<StaffPayment>(supabase.from("staff_payments").select("id, staff_id, pay_month, pay_type, amount, paid_on, note").eq("farm_id", farmId).eq("pay_month", `${month}-01`).order("paid_on", { ascending: false })),
  ]);
  return { staff, attendance, payments };
}

export const useStaffMonth = (farmId: string | undefined, month: string) =>
  useCached(farmId ? `staff.${farmId}.${month}` : null, () => fetchStaffMonth(farmId!, month));

export type Member = { user_id: string; role: string; name: string | null };
export type Invite = { id: string; email: string; role: string; created_at: string };

/** The farm's people, and the invitations still waiting (managers only see those). */
export async function fetchTeam(farmId: string, withInvites: boolean) {
  const members = await rows<{ user_id: string; role: string }>(supabase.from("farm_members").select("user_id, role, created_at").eq("farm_id", farmId).order("created_at"));
  const [profiles, invites] = await Promise.all([
    members.length ? rows<{ id: string; full_name: string | null }>(supabase.from("profiles").select("id, full_name").in("id", members.map((m) => m.user_id))) : Promise.resolve([]),
    withInvites ? rows<Invite>(supabase.from("farm_invites").select("id, email, role, created_at").eq("farm_id", farmId).eq("status", "pending").order("created_at", { ascending: false })) : Promise.resolve([]),
  ]);
  const names = new Map(profiles.map((p) => [p.id, p.full_name]));
  return { members: members.map((m) => ({ user_id: m.user_id, role: m.role, name: names.get(m.user_id) ?? null })) as Member[], invites };
}

export type MyInvite = { id: string; farm_id: string; farm_name: string; role: string; invited_by_name: string | null };

/** Invitations to other farms addressed to the signed-in person's email. */
export const fetchMyInvites = () => rows<MyInvite>(supabase.rpc("my_pending_invites"));

/** Server words for invite problems, as message keys. */
export function inviteError(message: string) {
  if (message.includes("ALREADY_MEMBER")) return "team.err.member" as const;
  if (message.includes("INVITE_NOT_FOUND")) return "team.err.notFound" as const;
  if (message.includes("VET_NEEDS_DOCTOR_ACCOUNT")) return "team.err.needDoctor" as const;
  if (message.includes("DOCTOR_CANNOT_STAFF")) return "team.err.doctorStaff" as const;
  return null;
}

/** Every row of a query, a thousand at a time (the server sends at most that many at once). */
async function allRows<T>(page: (from: number, to: number) => PromiseLike<{ data: unknown; error: { message: string } | null }>) {
  const out: T[] = [];
  for (let start = 0; ; start += 1000) {
    const part = await rows<T>(page(start, start + 999));
    out.push(...part);
    if (part.length < 1000) return out;
  }
}

/** Milk and eggs per day, for the charts. */
export async function fetchDaily(farmId: string, from: string, to: string, dairy: boolean, layer: boolean) {
  const [milk, eggs] = await Promise.all([
    dairy
      ? allRows<{ record_date: string; quantity_liters: number }>((a, b) =>
          supabase.from("milk_records").select("record_date, quantity_liters").eq("farm_id", farmId).gte("record_date", from).lte("record_date", to).order("id").range(a, b),
        )
      : Promise.resolve([]),
    layer
      ? allRows<{ log_date: string; eggs_collected: number }>((a, b) =>
          supabase.from("flock_daily_logs").select("log_date, eggs_collected").eq("farm_id", farmId).gte("log_date", from).lte("log_date", to).order("id").range(a, b),
        )
      : Promise.resolve([]),
  ]);
  return { milk, eggs };
}

/** Month totals for cost and profit per litre / per egg (the same numbers as the website). */
export const fetchMonthly = (farmId: string, from: string, to: string) => rows<MonthSummary>(supabase.rpc("farm_monthly_summary", { p_farm: farmId, p_from: from, p_to: to }));

export async function fetchAnimalProfit(farmId: string, from: string, to: string) {
  const { data, error } = await supabase.rpc("animal_profit_data", { p_farm: farmId, p_from: from, p_to: to });
  if (error) throw new Error(error.message);
  return data as AnimalProfitData;
}

/** Whether the farm's plan includes downloads (reports). */
export async function fetchCanExport(plan: string) {
  const { data, error } = await supabase.from("plans").select("can_export").eq("key", plan).maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data?.can_export);
}

export const minusDays = (iso: string, n: number) => new Date(Date.parse(iso) - n * 86_400_000).toISOString().slice(0, 10);

const ANIMAL_COLUMNS =
  "id, farm_id, tag_number, name, breed, category, status, species, sex, date_of_birth, purchase_date, purchase_price, father, mother_id, notes, photo_path, is_fattening, fattening_start, target_weight_kg, created_at, updated_at";
const HEALTH_COLUMNS = "id, cattle_id, record_date, record_type, description, product, next_due_date, cost, interval_days, updated_at";
const BREEDING_COLUMNS = "id, cattle_id, event_date, event_type, result, expected_calving_date, cost, bull_or_semen, technician, heat_signs, notes, updated_at";
const WEIGHT_COLUMNS = "id, cattle_id, weigh_date, weight_kg, method, created_at";

export type AnimalRow = {
  id: string;
  farm_id: string;
  tag_number: string;
  name: string | null;
  breed: string | null;
  category: string;
  status: string;
  species: string | null;
  sex: string | null;
  date_of_birth: string | null;
  purchase_date: string | null;
  father: string | null;
  mother_id: string | null;
  notes: string | null;
  photo_path: string | null;
  purchase_price: number | null;
  is_fattening: boolean;
  fattening_start: string | null;
  target_weight_kg: number | null;
  created_at: string;
  updated_at: string | null;
};
export type HealthRow = { id: string; cattle_id: string; record_date: string; record_type: string; description: string | null; product: string | null; next_due_date: string | null; cost: number | null; interval_days: number | null; updated_at: string | null };
export type BreedingRow = {
  id: string;
  cattle_id: string;
  event_date: string;
  event_type: string;
  result: string | null;
  expected_calving_date: string | null;
  cost: number | null;
  bull_or_semen: string | null;
  technician: string | null;
  heat_signs: string | null;
  notes: string | null;
  updated_at: string | null;
};
export type WeightRow = { id: string; cattle_id?: string; weigh_date: string; weight_kg: number; method: string; created_at?: string };

/** One animal's page: its details, last 30 days of milk, latest health and breeding records, weights. */
export type AnimalDetail = {
  animal: (AnimalRow & { mother: { tag_number: string; name: string | null } | null }) | null;
  weights: WeightRow[];
  costs: number;
  sale: { sale_date: string; amount: number } | null;
  settings: { targetDate: string | null; dailyCost: number; pricePerKg: number };
  milk: { record_date: string; quantity_liters: number }[];
  health: HealthRow[];
  breeding: BreedingRow[];
};

type FatteningSettings = { target_date?: string | null; daily_cost_cattle?: number | null; daily_cost_goat?: number | null; price_kg_cattle?: number | null; price_kg_goat?: number | null };

/** Puts one animal's page together (also used to keep every animal's page on the phone). */
export function buildAnimalDetail(
  row: AnimalRow | null,
  parts: { mother: { tag_number: string; name: string | null } | null; milk: AnimalDetail["milk"]; health: HealthRow[]; breeding: BreedingRow[]; weights: WeightRow[]; sale: AnimalDetail["sale"]; fattening: FatteningSettings | null; qurbani: string | null },
): AnimalDetail {
  const small = row?.species === "goat" || row?.species === "sheep";
  const s = (row?.is_fattening ? parts.fattening : null) ?? {};
  return {
    animal: row ? { ...row, mother: parts.mother } : null,
    milk: parts.milk,
    health: parts.health,
    breeding: parts.breeding,
    weights: parts.weights,
    costs: [...parts.health, ...parts.breeding].reduce((sum, r) => sum + Number(r.cost ?? 0), 0),
    sale: parts.sale,
    settings: {
      targetDate: s.target_date ?? parts.qurbani,
      dailyCost: Number((small ? s.daily_cost_goat : s.daily_cost_cattle) ?? 0),
      pricePerKg: Number((small ? s.price_kg_goat : s.price_kg_cattle) ?? 0),
    },
  };
}

export async function fetchAnimalDetail(id: string, since: string): Promise<AnimalDetail> {
  const [a, milk, health, breeding, weights, sale, sys] = await Promise.all([
    supabase.from("cattle").select(ANIMAL_COLUMNS).eq("id", id).is("deleted_at", null).maybeSingle(),
    supabase.from("milk_records").select("record_date, quantity_liters").eq("cattle_id", id).gte("record_date", since),
    supabase.from("health_records").select(HEALTH_COLUMNS).eq("cattle_id", id).order("record_date", { ascending: false }).limit(20),
    supabase.from("breeding_events").select(BREEDING_COLUMNS).eq("cattle_id", id).order("event_date", { ascending: false }).limit(20),
    supabase.from("cattle_weights").select(WEIGHT_COLUMNS).eq("cattle_id", id).order("weigh_date", { ascending: false }).order("created_at", { ascending: false }),
    supabase.from("sales").select("sale_date, amount").eq("cattle_id", id).eq("product", "animal").order("sale_date", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("system_settings").select("qurbani_date").eq("id", 1).maybeSingle(),
  ]);
  const err = a.error ?? milk.error ?? health.error ?? breeding.error ?? weights.error;
  if (err) throw new Error(err.message);
  const row = a.data as AnimalRow | null;
  // The mother is another row of the same table.
  const mother = row?.mother_id ? await supabase.from("cattle").select("tag_number, name").eq("id", row.mother_id).maybeSingle() : null;
  if (mother?.error) throw new Error(mother.error.message);
  // The farm's fattening numbers (the row is per farm; RLS shows only the farms you belong to).
  const fs = row?.is_fattening
    ? (await supabase.from("fattening_settings").select("target_date, daily_cost_cattle, daily_cost_goat, price_kg_cattle, price_kg_goat").eq("farm_id", row.farm_id).maybeSingle()).data
    : null;
  return buildAnimalDetail(row, {
    mother: (mother?.data as { tag_number: string; name: string | null } | null) ?? null,
    milk: (milk.data ?? []) as AnimalDetail["milk"],
    health: (health.data ?? []) as HealthRow[],
    breeding: (breeding.data ?? []) as BreedingRow[],
    weights: (weights.data ?? []) as WeightRow[],
    sale: (sale.data as AnimalDetail["sale"]) ?? null,
    fattening: fs as FatteningSettings | null,
    qurbani: (sys.data as { qurbani_date: string | null } | null)?.qurbani_date ?? null,
  });
}

/** Every animal's page at once (for keeping them on the phone): a few queries for the whole farm. */
export async function fetchAllAnimalDetails(farmId: string, today: string, windowStart: string): Promise<Map<string, AnimalDetail>> {
  const since = minusDays(today, 29);
  const [animals, milk, health, breeding, weights, sales, fs, sys] = await Promise.all([
    allRows<AnimalRow>((a, b) => supabase.from("cattle").select(ANIMAL_COLUMNS).eq("farm_id", farmId).is("deleted_at", null).order("id").range(a, b)),
    allRows<{ cattle_id: string; record_date: string; quantity_liters: number }>((a, b) =>
      supabase.from("milk_records").select("cattle_id, record_date, quantity_liters").eq("farm_id", farmId).gte("record_date", since).order("id").range(a, b),
    ),
    allRows<HealthRow>((a, b) => supabase.from("health_records").select(HEALTH_COLUMNS).eq("farm_id", farmId).gte("record_date", windowStart).order("record_date", { ascending: false }).order("id").range(a, b)),
    allRows<BreedingRow>((a, b) => supabase.from("breeding_events").select(BREEDING_COLUMNS).eq("farm_id", farmId).gte("event_date", windowStart).order("event_date", { ascending: false }).order("id").range(a, b)),
    allRows<WeightRow & { cattle_id: string }>((a, b) =>
      supabase.from("cattle_weights").select(WEIGHT_COLUMNS).eq("farm_id", farmId).order("weigh_date", { ascending: false }).order("created_at", { ascending: false }).order("id").range(a, b),
    ),
    rows<{ cattle_id: string; sale_date: string; amount: number }>(
      supabase.from("sales").select("cattle_id, sale_date, amount").eq("farm_id", farmId).eq("product", "animal").not("cattle_id", "is", null).order("sale_date", { ascending: false }),
    ),
    supabase.from("fattening_settings").select("target_date, daily_cost_cattle, daily_cost_goat, price_kg_cattle, price_kg_goat").eq("farm_id", farmId).maybeSingle(),
    supabase.from("system_settings").select("qurbani_date").eq("id", 1).maybeSingle(),
  ]);
  const by = <T extends { cattle_id?: string }>(list: T[]) => {
    const m = new Map<string, T[]>();
    for (const r of list) if (r.cattle_id) m.set(r.cattle_id, [...(m.get(r.cattle_id) ?? []), r]);
    return m;
  };
  const [milkBy, healthBy, breedingBy, weightsBy, salesBy] = [by(milk), by(health), by(breeding), by(weights), by(sales)];
  const tags = new Map(animals.map((a) => [a.id, { tag_number: a.tag_number, name: a.name }]));
  const qurbani = (sys.data as { qurbani_date: string | null } | null)?.qurbani_date ?? null;
  const out = new Map<string, AnimalDetail>();
  for (const a of animals) {
    const sale = salesBy.get(a.id)?.[0];
    out.set(
      a.id,
      buildAnimalDetail(a, {
        mother: a.mother_id ? (tags.get(a.mother_id) ?? null) : null,
        milk: (milkBy.get(a.id) ?? []).map((m) => ({ record_date: m.record_date, quantity_liters: m.quantity_liters })),
        health: (healthBy.get(a.id) ?? []).slice(0, 20),
        breeding: (breedingBy.get(a.id) ?? []).slice(0, 20),
        weights: weightsBy.get(a.id) ?? [],
        sale: sale ? { sale_date: sale.sale_date, amount: sale.amount } : null,
        fattening: (fs.data as FatteningSettings | null) ?? null,
        qurbani,
      }),
    );
  }
  return out;
}

/** What is already written for a day: milkings (and litres), flocks with a daily log (and eggs). */
export type Today = { sessions: string[]; flocks: string[]; litres: number; eggs: number };

export async function fetchToday(farmId: string, day: string, dairy: boolean, birds: boolean): Promise<Today> {
  const [milk, logs] = await Promise.all([
    dairy ? supabase.from("milk_records").select("session, quantity_liters").eq("farm_id", farmId).eq("record_date", day) : null,
    birds ? supabase.from("flock_daily_logs").select("flock_id, eggs_collected").eq("farm_id", farmId).eq("log_date", day) : null,
  ]);
  const err = milk?.error ?? logs?.error;
  if (err) throw new Error(err.message);
  const m = (milk?.data ?? []) as { session: string; quantity_liters: number }[];
  const l = (logs?.data ?? []) as { flock_id: string; eggs_collected: number }[];
  return {
    sessions: [...new Set(m.map((r) => r.session))],
    flocks: [...new Set(l.map((r) => r.flock_id))],
    litres: m.reduce((s, r) => s + Number(r.quantity_liters), 0),
    eggs: l.reduce((s, r) => s + Number(r.eggs_collected), 0),
  };
}

/** One milking: litres per cow and when each was last changed (to spot changes made elsewhere meanwhile). */
export type MilkDay = { values: Record<string, string>; seen: Record<string, string> };

export async function fetchMilkDay(farmId: string, day: string, session: string): Promise<MilkDay> {
  const list = await rows<{ cattle_id: string; quantity_liters: number; updated_at: string }>(
    supabase.from("milk_records").select("cattle_id, quantity_liters, updated_at").eq("farm_id", farmId).eq("record_date", day).eq("session", session),
  );
  return {
    values: Object.fromEntries(list.map((r) => [r.cattle_id, String(Number(r.quantity_liters))])),
    seen: Object.fromEntries(list.map((r) => [r.cattle_id, r.updated_at])),
  };
}

/** One flock's daily log as the form shows it (text fields), or null when none was written. */
export type FlockLog = { eggs: string; broken: string; mortality: string; culled: string; feed: string; weight: string; feedItem: string | null; updated_at: string | null };

export async function fetchFlockLog(flockId: string, day: string): Promise<FlockLog | null> {
  const { data, error } = await supabase
    .from("flock_daily_logs")
    .select("eggs_collected, eggs_broken, mortality, culled, feed_kg, avg_weight_g, feed_item_id, updated_at")
    .eq("flock_id", flockId)
    .eq("log_date", day)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const s = (v: unknown) => (v === null || v === undefined ? "" : String(Number(v)));
  return {
    eggs: s(data.eggs_collected),
    broken: s(data.eggs_broken),
    mortality: s(data.mortality),
    culled: s(data.culled),
    feed: s(data.feed_kg),
    weight: s(data.avg_weight_g),
    feedItem: (data.feed_item_id as string | null) ?? null,
    updated_at: (data.updated_at as string | null) ?? null,
  };
}
