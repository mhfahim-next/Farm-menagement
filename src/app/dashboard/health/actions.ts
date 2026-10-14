"use server";

import { revalidatePath } from "next/cache";
import { requireFarm } from "@/lib/auth";
import { dbError, int, num, str } from "@/lib/form";
import { healthTypeOptions, nextDue } from "@/lib/health";
import { today } from "@/lib/format";
import type { ActionState, HealthRecord } from "@/lib/types";

/** Records one vaccine / pesticide / treatment for one or many animals. */
export async function recordHealth(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireFarm();

  const cattleIds = [...new Set(formData.getAll("cattle_id").filter((v): v is string => typeof v === "string" && v !== ""))];
  const type = str(formData, "record_type");
  const product = str(formData, "product");
  const recordDate = str(formData, "record_date");
  if (cattleIds.length === 0) return { error: "Select at least one animal." };
  if (!type || !healthTypeOptions.some((o) => o.value === type)) return { error: "Choose what was given." };
  if (!product) return { error: "Enter the vaccine or product name." };
  if (!recordDate) return { error: "Choose the date." };
  if (recordDate > today()) return { error: "The date can't be in the future." };

  const interval = int(formData, "interval_days");
  if (interval !== null && interval <= 0) return { error: "Repeat interval must be at least 1 day." };

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
  if (error) return { error: dbError(error) };

  revalidatePath("/dashboard", "layout");
  const n = rows.length;
  return { success: `${product} recorded for ${n} animal${n === 1 ? "" : "s"}.` };
}

/** "Done today": repeats a scheduled record and pushes the next due date out. */
export async function renewHealth(formData: FormData) {
  const { supabase, farm } = await requireFarm();
  const id = str(formData, "id");
  if (!id) return;

  const { data } = await supabase
    .from("health_records")
    .select("*")
    .eq("id", id)
    .eq("farm_id", farm.id)
    .maybeSingle();
  const prev = data as HealthRecord | null;
  if (!prev) return;

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
  if (error) throw new Error(dbError(error));

  revalidatePath("/dashboard", "layout");
}
