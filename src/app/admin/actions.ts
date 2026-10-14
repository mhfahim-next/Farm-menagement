"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth";
import { str } from "@/lib/form";
import { getI18n } from "@/lib/i18n/server";
import type { ActionState } from "@/lib/types";

/**
 * Every admin action: confirm the caller is a super admin (404 otherwise),
 * then call the matching admin_* Postgres function, which checks again and
 * writes the audit log entry.
 */
async function run(
  rpc: (supabase: Awaited<ReturnType<typeof requireSuperAdmin>>["supabase"]) => PromiseLike<{ error: { message: string } | null }>,
  success: string,
): Promise<ActionState> {
  const { supabase } = await requireSuperAdmin();
  const { error } = await rpc(supabase);
  if (error) return { error: error.message };
  revalidatePath("/admin", "layout");
  return { success };
}

export async function setUserBanned(_: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const id = str(formData, "id");
  if (!id) return { error: t("common.errorGeneric") };
  return run((s) => s.rpc("admin_set_user_banned", { p_user: id, p_banned: formData.get("banned") === "true" }), t("admin.actionDone"));
}

export async function setSuperAdmin(_: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const id = str(formData, "id");
  if (!id) return { error: t("common.errorGeneric") };
  return run((s) => s.rpc("admin_set_super_admin", { p_user: id, p_value: formData.get("value") === "true" }), t("admin.actionDone"));
}

export async function deleteUser(_: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const id = str(formData, "id");
  if (!id) return { error: t("common.errorGeneric") };
  return run((s) => s.rpc("admin_delete_user", { p_user: id }), t("admin.actionDone"));
}

export async function setFarmPlan(_: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const id = str(formData, "id");
  const plan = str(formData, "plan");
  if (!id || !plan) return { error: t("common.errorGeneric") };
  return run((s) => s.rpc("admin_set_farm_plan", { p_farm: id, p_plan: plan }), t("admin.planUpdated"));
}

export async function setFarmSuspended(_: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const id = str(formData, "id");
  if (!id) return { error: t("common.errorGeneric") };
  return run((s) => s.rpc("admin_set_farm_suspended", { p_farm: id, p_suspended: formData.get("suspended") === "true" }), t("admin.actionDone"));
}

export async function deleteFarm(_: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const id = str(formData, "id");
  if (!id) return { error: t("common.errorGeneric") };
  return run((s) => s.rpc("admin_delete_farm", { p_farm: id }), t("admin.actionDone"));
}

export async function saveAnnouncement(_: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  return run(
    (s) =>
      s.rpc("admin_set_announcement", {
        p_en: str(formData, "announcement_en") ?? "",
        p_bn: str(formData, "announcement_bn") ?? "",
        p_active: formData.get("active") === "on",
      }),
    t("admin.announceSaved"),
  );
}
