"use server";

import { revalidatePath } from "next/cache";
import { requireFarm } from "@/lib/auth";
import { dbError, int, num, str } from "@/lib/form";
import type { ActionState } from "@/lib/types";

export async function addFlock(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireFarm();
  const name = str(formData, "name");
  const initialCount = int(formData, "initial_count");
  if (!name) return { error: "Give the flock a name." };
  if (!initialCount || initialCount <= 0) return { error: "Enter how many birds were placed." };

  const { error } = await supabase.from("flocks").insert({
    farm_id: farm.id,
    name,
    breed: str(formData, "breed"),
    shed: str(formData, "shed"),
    placed_date: str(formData, "placed_date"),
    age_at_placement_weeks: int(formData, "age_at_placement_weeks") ?? 0,
    initial_count: initialCount,
    notes: str(formData, "notes"),
  });
  if (error) return { error: dbError(error) };

  revalidatePath("/dashboard", "layout");
  return { success: `Flock “${name}” added.` };
}

export async function updateFlockStatus(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireFarm();
  const id = str(formData, "id");
  const status = str(formData, "status");
  if (!id || !status) return { error: "Missing flock." };

  const { error } = await supabase.from("flocks").update({ status }).eq("id", id).eq("farm_id", farm.id);
  if (error) return { error: dbError(error) };

  revalidatePath("/dashboard", "layout");
  return { success: "Status updated." };
}

/** One log per flock per day; saving the same day again overwrites it. */
export async function saveDailyLog(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireFarm();
  const flockId = str(formData, "flock_id");
  const logDate = str(formData, "log_date");
  if (!flockId || !logDate) return { error: "Choose a date." };

  const { error } = await supabase.from("flock_daily_logs").upsert(
    {
      farm_id: farm.id,
      flock_id: flockId,
      log_date: logDate,
      eggs_collected: int(formData, "eggs_collected") ?? 0,
      eggs_broken: int(formData, "eggs_broken") ?? 0,
      mortality: int(formData, "mortality") ?? 0,
      culled: int(formData, "culled") ?? 0,
      feed_kg: num(formData, "feed_kg"),
      water_liters: num(formData, "water_liters"),
      notes: str(formData, "notes"),
    },
    { onConflict: "flock_id,log_date" },
  );
  if (error) return { error: dbError(error) };

  revalidatePath("/dashboard", "layout");
  return { success: "Daily log saved." };
}
