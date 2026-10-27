// What the app reads from the server, with the person's own session (row-level security applies).
import { useCached } from "./cache";
import type { OptionRow } from "./options";
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
