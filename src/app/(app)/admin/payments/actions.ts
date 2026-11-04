"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth";
import { int, num, str } from "@/lib/form";
import { getI18n } from "@/lib/i18n/server";
import type { ActionState } from "@/lib/types";

const done = () => {
  revalidatePath("/admin", "layout");
  revalidatePath("/dashboard", "layout");
};

/** Accept (the plan starts now) or decline a payment. */
export async function reviewPayment(id: string, approve: boolean, note: string): Promise<ActionState> {
  const { supabase } = await requireSuperAdmin();
  const { t } = await getI18n();
  const { error } = await supabase.rpc("admin_review_payment", { p_id: id, p_approve: approve, p_note: note });
  if (error) return { error: error.message };
  done();
  return { success: t(approve ? "adminpay.approved" : "adminpay.rejected") };
}

/** A paid plan has ended: move the farm to Free, give more time, or remove the end date. */
export async function planExpiry(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireSuperAdmin();
  const { t } = await getI18n();
  const action = str(formData, "action");
  const { error } = await supabase.rpc("admin_plan_expiry", {
    p_farm: str(formData, "farm"),
    p_action: action,
    p_months: int(formData, "months") ?? 1,
  });
  if (error) return { error: error.message };
  done();
  return { success: t("adminpay.expiryDone") };
}

export async function setPaymentsEnabled(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireSuperAdmin();
  const { t } = await getI18n();
  const { error } = await supabase.rpc("admin_set_payments_enabled", { p_on: str(formData, "on") === "1" });
  if (error) return { error: error.message };
  done();
  return { success: t("adminpay.saved") };
}

export async function saveMethod(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireSuperAdmin();
  const { t } = await getI18n();
  const key = str(formData, "key");
  const currencies = ["BDT", "USD"].filter((c) => formData.get(`cur_${c}`) === "on");
  if (!key) return { error: t("common.errorGeneric") };
  if (currencies.length === 0) return { error: t("adminpay.err.currency") };
  const name = str(formData, "name_en");
  if (!name) return { error: t("options.err.label") };

  const { data, error } = await supabase
    .from("payment_methods")
    .update({
      name_en: name,
      name_bn: str(formData, "name_bn"),
      account_number: str(formData, "account_number"),
      account_name: str(formData, "account_name"),
      account_type: str(formData, "account_type"),
      instructions_en: str(formData, "instructions_en"),
      instructions_bn: str(formData, "instructions_bn"),
      currencies,
      active: formData.get("active") === "on",
      sort_order: int(formData, "sort_order") ?? 0,
    })
    .eq("key", key)
    .select("key");
  if (error) {
    if (error.message.includes("account number")) return { error: t("adminpay.err.number") };
    return { error: error.message };
  }
  if (!data?.length) return { error: t("common.dbForbidden") };
  done();
  return { success: t("adminpay.saved") };
}

export async function savePeriod(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireSuperAdmin();
  const { t } = await getI18n();
  const months = int(formData, "months");
  const discount = num(formData, "discount") ?? 0;
  if (!months || months < 1 || months > 36 || discount < 0 || discount > 90) return { error: t("adminpay.err.period") };
  const { error } = await supabase
    .from("billing_periods")
    .upsert({ months, discount_percent: discount, active: formData.get("active") === "on", updated_at: new Date().toISOString() });
  if (error) return { error: error.message };
  done();
  return { success: t("adminpay.saved") };
}

export async function deletePeriod(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireSuperAdmin();
  const { t } = await getI18n();
  const { error } = await supabase.from("billing_periods").delete().eq("months", int(formData, "months") ?? 0);
  if (error) return { error: error.message };
  done();
  return { success: t("adminpay.saved") };
}
