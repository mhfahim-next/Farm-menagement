"use server";

import { revalidatePath } from "next/cache";
import { queueIfVet } from "@/lib/approvals";
import { MANAGERS, requireFarm, requireRole } from "@/lib/auth";
import { dbError, int, num, str } from "@/lib/form";
import { nextDue } from "@/lib/health";
import { getI18n } from "@/lib/i18n/server";
import { today } from "@/lib/format";
import type { ActionState, HealthRecord } from "@/lib/types";

/** Records one vaccine / pesticide / treatment for one or many animals. */
export async function recordHealth(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm, role } = await requireFarm();
  const { t, options } = await getI18n();
  const queued = await queueIfVet({ supabase, farm, role }, "record_health", formData);
  if (queued) return queued;

  const cattleIds = [...new Set(formData.getAll("cattle_id").filter((v): v is string => typeof v === "string" && v !== ""))];
  const type = str(formData, "record_type");
  const product = str(formData, "product");
  const recordDate = str(formData, "record_date");
  if (cattleIds.length === 0) return { error: t("health.selectOne") };
  if (!type || !options("health_type").some((x) => x.value === type)) return { error: t("health.chooseWhat") };
  if (!product) return { error: t("health.enterProduct") };
  if (!recordDate) return { error: t("health.chooseDate") };
  if (recordDate > today()) return { error: t("health.dateFuture") };

  const interval = int(formData, "interval_days");
  if (interval !== null && interval <= 0) return { error: t("health.intervalMin") };

  const rows = cattleIds.map((cattle_id) => ({
    farm_id: farm.id,
    cattle_id,
    record_date: recordDate,
    record_type: type,
    description: str(formData, "description") ?? product,
    product,
    dose: str(formData, "dose"),
    batch_number: str(formData, "batch_number"),
    interval_days: interval,
    next_due_date: nextDue(recordDate, interval),
    medicine: product,
    vet_name: str(formData, "vet_name"),
    cost: num(formData, "cost"),
    withdrawal_until: str(formData, "withdrawal_until"),
  }));

  const { error } = await supabase.from("health_records").insert(rows);
  if (error) return { error: dbError(t, error) };

  revalidatePath("/dashboard", "layout");
  return { success: t("health.recorded", { product, n: rows.length }) };
}

/** Edits one existing record (any member who can write health records, including vets). */
export async function updateHealth(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm, role } = await requireFarm();
  const { t, options } = await getI18n();
  const queued = await queueIfVet({ supabase, farm, role }, "update_health", formData);
  if (queued) return queued;

  const id = str(formData, "id");
  const type = str(formData, "record_type");
  const product = str(formData, "product");
  const recordDate = str(formData, "record_date");
  if (!id) return { error: t("common.errorGeneric") };
  if (!type || !options("health_type").some((x) => x.value === type)) return { error: t("health.chooseWhat") };
  if (!product) return { error: t("health.enterProduct") };
  if (!recordDate) return { error: t("health.chooseDate") };
  if (recordDate > today()) return { error: t("health.dateFuture") };
  const interval = int(formData, "interval_days");
  if (interval !== null && interval <= 0) return { error: t("health.intervalMin") };

  const { data, error } = await supabase
    .from("health_records")
    .update({
      record_date: recordDate,
      record_type: type,
      description: str(formData, "description") ?? product,
      product,
      dose: str(formData, "dose"),
      batch_number: str(formData, "batch_number"),
      interval_days: interval,
      next_due_date: nextDue(recordDate, interval),
      medicine: product,
      vet_name: str(formData, "vet_name"),
      cost: num(formData, "cost"),
      withdrawal_until: str(formData, "withdrawal_until"),
    })
    .eq("id", id)
    .eq("farm_id", farm.id)
    .select("id");
  if (error) return { error: dbError(t, error) };
  if (!data?.length) return { error: t("health.recordMissing") };

  revalidatePath("/dashboard", "layout");
  return { success: t("health.updated", { product }) };
}

/** "Done today": repeats a scheduled record and pushes the next due date out. */
export async function renewHealth(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm, role } = await requireFarm();
  const { t } = await getI18n();
  const queued = await queueIfVet({ supabase, farm, role }, "renew_health", formData);
  if (queued) return queued;
  const id = str(formData, "id");
  if (!id) return { error: t("common.errorGeneric") };

  const { data } = await supabase
    .from("health_records")
    .select("*")
    .eq("id", id)
    .eq("farm_id", farm.id)
    .maybeSingle();
  const prev = data as HealthRecord | null;
  if (!prev) return { error: t("common.errorGeneric") };

  const date = today();
  const { error } = await supabase.from("health_records").insert({
    farm_id: farm.id,
    cattle_id: prev.cattle_id,
    record_date: date,
    record_type: prev.record_type,
    description: prev.description,
    product: prev.product,
    dose: prev.dose,
    interval_days: prev.interval_days,
    next_due_date: nextDue(date, prev.interval_days),
    medicine: prev.medicine,
  });
  if (error) return { error: dbError(t, error) };

  revalidatePath("/dashboard", "layout");
  return { success: t("health.renewed", { product: prev.product ?? prev.description ?? "" }) };
}

/** Removes one health record (owners and managers; vets can only propose edits). */
export async function deleteHealth(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireRole(MANAGERS);
  const { t } = await getI18n();
  const id = str(formData, "id");
  if (!id) return { error: t("common.errorGeneric") };
  const { error } = await supabase.from("health_records").delete().eq("id", id).eq("farm_id", farm.id);
  if (error) return { error: dbError(t, error) };
  revalidatePath("/dashboard", "layout");
  return { success: t("health.deleted") };
}
