"use server";

import { revalidatePath } from "next/cache";
import { requireRole, STAFF } from "@/lib/auth";
import { dbError, wrongFarm, int, num, str } from "@/lib/form";
import { getI18n } from "@/lib/i18n/server";
import type { ActionState } from "@/lib/types";

export async function addFlock(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireRole(STAFF);
  const { t } = await getI18n();
  const name = str(formData, "name");
  const initialCount = int(formData, "initial_count");
  if (!name) return { error: t("flocks.giveName") };
  if (!initialCount || initialCount <= 0) return { error: t("flocks.enterBirds") };

  const kindRaw = str(formData, "kind");
  const kind = kindRaw === "broiler" || kindRaw === "sonali" ? kindRaw : "layer";
  if (kind === "layer" ? !farm.has_layer : !farm.has_broiler) return { error: t("broiler.errKind") };
  const meat = kind !== "layer";

  const { error } = await supabase.from("flocks").insert({
    farm_id: farm.id,
    kind,
    chick_price: meat ? num(formData, "chick_price") : null,
    name,
    breed: str(formData, "breed"),
    shed: str(formData, "shed"),
    placed_date: str(formData, "placed_date"),
    age_at_placement_weeks: meat ? 0 : (int(formData, "age_at_placement_weeks") ?? 0),
    initial_count: initialCount,
    notes: str(formData, "notes"),
  });
  if (error) return { error: dbError(t, error) };

  revalidatePath("/dashboard", "layout");
  return { success: t("flocks.added", { name }) };
}

export async function updateFlockStatus(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireRole(STAFF);
  const { t } = await getI18n();
  const id = str(formData, "id");
  const status = str(formData, "status");
  if (!id || !status) return { error: t("flocks.missing") };

  const { error } = await supabase.from("flocks").update({ status }).eq("id", id).eq("farm_id", farm.id);
  if (error) return { error: dbError(t, error) };

  revalidatePath("/dashboard", "layout");
  return { success: t("flocks.statusUpdated") };
}

/** One log per flock per day; saving the same day again overwrites it. */
export async function saveDailyLog(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireRole(STAFF);
  const { t } = await getI18n();
  if (wrongFarm(formData, farm.id)) return { error: t("offline.wrongFarm") };
  const flockId = str(formData, "flock_id");
  const logDate = str(formData, "log_date");
  if (!flockId || !logDate) return { error: t("flocks.chooseDate") };

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
      // Only meat-batch forms send a weight; other forms keep what was saved.
      ...(formData.has("avg_weight_g") ? { avg_weight_g: num(formData, "avg_weight_g") } : {}),
      // Only sent when the form offers stock feed; otherwise the saved choice is kept.
      ...(formData.has("feed_item_id") ? { feed_item_id: str(formData, "feed_item_id") } : {}),
      notes: str(formData, "notes"),
    },
    { onConflict: "flock_id,log_date" },
  );
  if (error) return { error: dbError(t, error) };

  revalidatePath("/dashboard", "layout");
  return { success: t("flocks.logSaved") };
}
