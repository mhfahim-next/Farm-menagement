"use server";

import { revalidatePath } from "next/cache";
import { requireRole, STAFF } from "@/lib/auth";
import { today } from "@/lib/format";
import { dbError, int, num, str } from "@/lib/form";
import { nextDue } from "@/lib/health";
import { getI18n } from "@/lib/i18n/server";
import type { ActionState, FlockHealthRecord } from "@/lib/types";

function refresh() {
  revalidatePath("/dashboard", "layout");
}

/** Reads and checks the fields shared by "add" and "edit". */
async function readFields(formData: FormData) {
  const { t, options } = await getI18n();
  const type = str(formData, "record_type");
  const product = str(formData, "product");
  const recordDate = str(formData, "record_date");
  if (!type || !options("health_type").some((x) => x.value === type)) return { error: t("health.chooseWhat") };
  if (!product) return { error: t("health.enterProduct") };
  if (!recordDate) return { error: t("health.chooseDate") };
  if (recordDate > today()) return { error: t("health.dateFuture") };
  const interval = int(formData, "interval_days");
  if (interval !== null && interval <= 0) return { error: t("health.intervalMin") };
  const cost = num(formData, "cost");
  if (cost !== null && cost < 0) return { error: t("flockHealth.badCost") };
  return {
    values: {
      record_date: recordDate,
      record_type: type,
      product,
      dose: str(formData, "dose"),
      batch_number: str(formData, "batch_number"),
      vet_name: str(formData, "vet_name"),
      cost,
      interval_days: interval,
      next_due_date: nextDue(recordDate, interval),
      withdrawal_until: str(formData, "withdrawal_until"),
      notes: str(formData, "notes"),
    },
  };
}

export async function recordFlockHealth(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireRole(STAFF);
  const { t } = await getI18n();
  const flockIds = formData.getAll("flock_id").filter((v): v is string => typeof v === "string" && v !== "");
  if (flockIds.length === 0) return { error: t("flockHealth.chooseFlock") };
  const read = await readFields(formData);
  if ("error" in read) return { error: read.error };

  const { error } = await supabase
    .from("flock_health_records")
    .insert(flockIds.map((flock_id) => ({ farm_id: farm.id, flock_id, ...read.values })));
  if (error) return { error: dbError(t, error) };
  refresh();
  return { success: t("flockHealth.saved", { n: flockIds.length }) };
}

export async function updateFlockHealth(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireRole(STAFF);
  const { t } = await getI18n();
  const id = str(formData, "id");
  if (!id) return { error: t("common.errorGeneric") };
  const read = await readFields(formData);
  if ("error" in read) return { error: read.error };

  const { data, error } = await supabase
    .from("flock_health_records")
    .update(read.values)
    .eq("id", id)
    .eq("farm_id", farm.id)
    .select("id");
  if (error) return { error: dbError(t, error) };
  if (!data?.length) return { error: t("health.recordMissing") };
  refresh();
  return { success: t("flockHealth.updated") };
}

/** "Done today": repeats a scheduled item with a fresh date. */
export async function renewFlockHealth(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireRole(STAFF);
  const { t } = await getI18n();
  const id = str(formData, "id");
  if (!id) return { error: t("common.errorGeneric") };
  const { data } = await supabase.from("flock_health_records").select("*").eq("id", id).eq("farm_id", farm.id).maybeSingle();
  const prev = data as FlockHealthRecord | null;
  if (!prev) return { error: t("common.errorGeneric") };

  const date = today();
  const { error } = await supabase.from("flock_health_records").insert({
    farm_id: farm.id,
    flock_id: prev.flock_id,
    record_date: date,
    record_type: prev.record_type,
    product: prev.product,
    dose: prev.dose,
    interval_days: prev.interval_days,
    next_due_date: nextDue(date, prev.interval_days),
  });
  if (error) return { error: dbError(t, error) };
  refresh();
  return { success: t("health.renewed", { product: prev.product }) };
}

export async function deleteFlockHealth(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireRole(STAFF);
  const { t } = await getI18n();
  const id = str(formData, "id");
  if (!id) return { error: t("common.errorGeneric") };
  const { error } = await supabase.from("flock_health_records").delete().eq("id", id).eq("farm_id", farm.id);
  if (error) return { error: dbError(t, error) };
  refresh();
  return { success: t("flockHealth.deleted") };
}
