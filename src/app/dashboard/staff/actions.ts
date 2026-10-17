"use server";

import { revalidatePath } from "next/cache";
import { MANAGERS, requireRole } from "@/lib/auth";
import { dbError, num, str } from "@/lib/form";
import { getI18n } from "@/lib/i18n/server";
import type { ActionState } from "@/lib/types";

const MODULES = ["dairy", "layer", "both"];
const STATUSES = ["present", "absent", "half_day", "leave"];
const PAY_TYPES = ["salary", "advance", "bonus"];

function refresh(id?: string) {
  revalidatePath("/dashboard/staff");
  if (id) revalidatePath(`/dashboard/staff/${id}`);
  revalidatePath("/dashboard/finance");
  revalidatePath("/dashboard", "layout");
}

export async function addStaff(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireRole(MANAGERS);
  const { t } = await getI18n();
  const name = str(formData, "name");
  if (!name) return { error: t("staff.giveName") };
  const worksOn = str(formData, "module") ?? "both";
  if (!MODULES.includes(worksOn)) return { error: t("staff.chooseModule") };
  const salary = num(formData, "monthly_salary") ?? 0;
  if (salary < 0) return { error: t("staff.badSalary") };

  const { error } = await supabase.from("staff").insert({
    farm_id: farm.id,
    name,
    phone: str(formData, "phone"),
    position: str(formData, "position"),
    module: worksOn,
    monthly_salary: salary,
    join_date: str(formData, "join_date") ?? undefined,
    notes: str(formData, "notes"),
  });
  if (error) return { error: dbError(t, error) };
  refresh();
  return { success: t("staff.added", { name }) };
}

export async function updateStaff(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireRole(MANAGERS);
  const { t } = await getI18n();
  const id = str(formData, "id");
  const name = str(formData, "name");
  if (!id || !name) return { error: t("staff.giveName") };
  const worksOn = str(formData, "module") ?? "both";
  if (!MODULES.includes(worksOn)) return { error: t("staff.chooseModule") };
  const salary = num(formData, "monthly_salary") ?? 0;
  if (salary < 0) return { error: t("staff.badSalary") };

  const { error } = await supabase
    .from("staff")
    .update({
      name,
      phone: str(formData, "phone"),
      position: str(formData, "position"),
      module: worksOn,
      monthly_salary: salary,
      active: formData.get("active") === "on",
      notes: str(formData, "notes"),
    })
    .eq("id", id)
    .eq("farm_id", farm.id);
  if (error) return { error: dbError(t, error) };
  refresh(id);
  return { success: t("staff.updated") };
}

/** Attendance for every staff member on one date; saving the same day again overwrites it. */
export async function saveAttendance(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireRole(MANAGERS);
  const { t } = await getI18n();
  const date = str(formData, "att_date");
  if (!date) return { error: t("staff.chooseDate") };

  const rows: { farm_id: string; staff_id: string; att_date: string; status: string; note: string | null }[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("status_") || typeof value !== "string") continue;
    if (!STATUSES.includes(value)) continue;
    const staffId = key.slice("status_".length);
    rows.push({ farm_id: farm.id, staff_id: staffId, att_date: date, status: value, note: str(formData, `note_${staffId}`) });
  }
  if (rows.length === 0) return { error: t("staff.noStaffToMark") };

  const { error } = await supabase.from("staff_attendance").upsert(rows, { onConflict: "staff_id,att_date" });
  if (error) return { error: dbError(t, error) };
  refresh();
  return { success: t("staff.attendanceSaved", { n: rows.length }) };
}

export async function addStaffPayment(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireRole(MANAGERS);
  const { t } = await getI18n();
  const staffId = str(formData, "staff_id");
  const month = str(formData, "pay_month"); // YYYY-MM
  const amount = num(formData, "amount");
  const payType = str(formData, "pay_type") ?? "salary";
  if (!staffId || !month || !/^\d{4}-\d{2}$/.test(month)) return { error: t("staff.chooseMonth") };
  if (amount == null || amount <= 0) return { error: t("staff.enterAmount") };
  if (!PAY_TYPES.includes(payType)) return { error: t("staff.choosePayType") };

  const { error } = await supabase.from("staff_payments").insert({
    farm_id: farm.id,
    staff_id: staffId,
    pay_month: `${month}-01`,
    pay_type: payType,
    amount,
    paid_on: str(formData, "paid_on") ?? undefined,
    note: str(formData, "note"),
  });
  if (error) return { error: dbError(t, error) };
  refresh(staffId);
  return { success: t("staff.paymentAdded") };
}

export async function deleteStaffPayment(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireRole(MANAGERS);
  const { t } = await getI18n();
  const id = str(formData, "id");
  if (!id) return { error: t("common.errorGeneric") };
  const { data, error } = await supabase
    .from("staff_payments")
    .delete()
    .eq("id", id)
    .eq("farm_id", farm.id)
    .select("staff_id")
    .maybeSingle();
  if (error) return { error: dbError(t, error) };
  refresh(data?.staff_id);
  return { success: t("staff.paymentDeleted") };
}
