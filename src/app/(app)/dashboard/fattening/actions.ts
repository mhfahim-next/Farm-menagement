"use server";

import { revalidatePath } from "next/cache";
import { MANAGERS, requireRole, STAFF } from "@/lib/auth";
import { dbError, num, str } from "@/lib/form";
import { today } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import type { ActionState } from "@/lib/types";

const UUID = /^[0-9a-f-]{36}$/i;

export async function saveFatteningSettings(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireRole(MANAGERS);
  const { t } = await getI18n();
  const values = {
    target_date: str(formData, "target_date"),
    daily_cost_cattle: num(formData, "daily_cost_cattle"),
    daily_cost_goat: num(formData, "daily_cost_goat"),
    price_kg_cattle: num(formData, "price_kg_cattle"),
    price_kg_goat: num(formData, "price_kg_goat"),
  };
  if (Object.values(values).some((v) => typeof v === "number" && v < 0)) return { error: t("common.dbRange") };
  const { error } = await supabase
    .from("fattening_settings")
    .upsert({ farm_id: farm.id, ...values, updated_at: new Date().toISOString() }, { onConflict: "farm_id" });
  if (error) return { error: dbError(t, error) };
  revalidatePath("/dashboard/fattening");
  return { success: t("fatten.settingsSaved") };
}

/** Marks animals already on the farm as being fattened from today. */
export async function startFattening(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireRole(STAFF);
  const { t } = await getI18n();
  const ids = formData.getAll("ids").filter((v): v is string => typeof v === "string" && UUID.test(v));
  if (ids.length === 0) return { error: t("fatten.chooseAnimals") };
  const { data, error } = await supabase
    .from("cattle")
    .update({ is_fattening: true, fattening_start: str(formData, "start_date") ?? today() })
    .eq("farm_id", farm.id)
    .eq("is_fattening", false)
    .in("id", ids)
    .select("id");
  if (error) return { error: dbError(t, error) };
  revalidatePath("/dashboard", "layout");
  return { success: t("fatten.started", { n: data?.length ?? 0 }) };
}

export async function stopFattening(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireRole(STAFF);
  const { t } = await getI18n();
  const id = str(formData, "id");
  if (!id || !UUID.test(id)) return { error: t("common.errorGeneric") };
  const { error } = await supabase.from("cattle").update({ is_fattening: false, fattening_start: null }).eq("id", id).eq("farm_id", farm.id);
  if (error) return { error: dbError(t, error) };
  revalidatePath("/dashboard", "layout");
  return { success: t("fatten.stopped") };
}

/** Start fattening one animal (from its page). */
export async function startFatteningOne(_: ActionState, formData: FormData): Promise<ActionState> {
  const fd = new FormData();
  const id = str(formData, "id");
  if (id) fd.append("ids", id);
  return startFattening(null, fd);
}
