"use server";

import { revalidatePath } from "next/cache";
import { MANAGERS, requireRole } from "@/lib/auth";
import { dbError, str } from "@/lib/form";
import { getI18n } from "@/lib/i18n/server";
import type { ActionState } from "@/lib/types";

export async function requestUpgrade(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireRole(MANAGERS);
  const { t } = await getI18n();
  const plan = str(formData, "plan");
  if (!plan) return { error: t("common.errorGeneric") };

  const { error } = await supabase.from("requests").insert({
    farm_id: farm.id,
    kind: "upgrade",
    plan_requested: plan,
    message: str(formData, "message"),
  });
  if (error) {
    if (error.code === "23505") return { error: t("plan.requestExists") };
    if (error.message.includes("already on this plan")) return { error: t("plan.requestSame") };
    if (error.code === "42501" || error.code === "PGRST301") return { error: t("plan.requestOnlyOwner") };
    return { error: dbError(t, error) };
  }

  revalidatePath("/dashboard/plan");
  return { success: t("plan.requestSent") };
}

export async function cancelRequest(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireRole(MANAGERS);
  const { t } = await getI18n();
  const id = str(formData, "id");
  if (!id) return { error: t("common.errorGeneric") };
  // RLS only lets a farm manager delete a request that is still open.
  const { data, error } = await supabase.from("requests").delete().eq("id", id).eq("status", "open").select("id");
  if (error || !data?.length) return { error: t("common.errorGeneric") };
  revalidatePath("/dashboard/plan");
  return { success: t("plan.requestCancelled") };
}

export async function sendSupport(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireRole(MANAGERS);
  const { t } = await getI18n();
  const message = str(formData, "message");
  if (!message) return { error: t("plan.supportEmpty") };

  const { error } = await supabase.from("requests").insert({
    farm_id: farm.id,
    kind: "support",
    subject: str(formData, "subject"),
    message,
  });
  if (error) return { error: dbError(t, error) };

  revalidatePath("/dashboard/plan");
  return { success: t("plan.supportSent") };
}
