// What the app reads from the server, with the person's own session (row-level security applies).
import { useCached } from "./cache";
import type { OptionRow } from "./options";
import { DEFAULT_RULES, type BreedingRules } from "./records";
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
      .select("id, tag_number, name, breed, category, status, species, date_of_birth, is_fattening")
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
