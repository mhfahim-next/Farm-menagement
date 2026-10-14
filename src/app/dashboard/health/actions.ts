"use server";

import { revalidatePath } from "next/cache";
import { requireFarm } from "@/lib/auth";
import { dbError, int, num, str } from "@/lib/form";
import { healthTypes, nextDue } from "@/lib/health";
import { getI18n } from "@/lib/i18n/server";
import { today } from "@/lib/format";
import type { ActionState, HealthRecord } from "@/lib/types";

/** Records one vaccine / pesticide / treatment for one or many animals. */
export async function recordHealth(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireFarm();
  const { t } = await getI18n();

  const cattleIds = [...new Set(formData.getAll("cattle_id").filter((v): v is string => typeof v === "string" && v !== ""))];
  const type = str(formData, "record_type");
  const product = str(formData, "product");
  const recordDate = str(formData, "record_date");
  if (cattleIds.length === 0) return { error: t("health.selectOne") };
  if (!type || !(healthTypes as string[]).includes(type)) return { error: t("health.chooseWhat") };
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

/** "Done today": repeats a scheduled record and pushes the next due date out. */
export async function renewHealth(formData: FormData) {
  const { supabase, farm } = await requireFarm();
  const { t } = await getI18n();
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
  if (error) throw new Error(dbError(t, error));

  revalidatePath("/dashboard", "layout");
}
