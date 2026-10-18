"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth";
import { str } from "@/lib/form";
import { getI18n } from "@/lib/i18n/server";
import type { ActionState } from "@/lib/types";

const UUID = /^[0-9a-f-]{36}$/i;

function refresh() {
  revalidatePath("/admin/community");
  revalidatePath("/community", "layout");
}

export async function moderatePost(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireSuperAdmin();
  const { t } = await getI18n();
  const type = str(formData, "type");
  const id = str(formData, "id");
  const status = str(formData, "status");
  if ((type !== "question" && type !== "answer") || !id || !UUID.test(id)) return { error: t("common.errorGeneric") };
  const { error } =
    status === "dismiss"
      ? await supabase.rpc("admin_community_dismiss_reports", { p_type: type, p_id: id })
      : await supabase.rpc("admin_community_set_status", { p_type: type, p_id: id, p_status: status });
  if (error) return { error: error.message };
  refresh();
  return { success: t("admin.community.done") };
}

export async function banMember(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireSuperAdmin();
  const { t } = await getI18n();
  const user = str(formData, "user_id");
  if (!user || !UUID.test(user)) return { error: t("common.errorGeneric") };
  const banned = formData.get("banned") === "true";
  const { error } = await supabase.rpc("admin_community_ban", { p_user: user, p_banned: banned });
  if (error) return { error: error.message };
  refresh();
  return { success: t(banned ? "admin.community.banned" : "admin.community.unbanned") };
}

export async function setPremoderation(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireSuperAdmin();
  const { t } = await getI18n();
  const { error } = await supabase.rpc("admin_set_community_premoderation", { p_value: formData.get("value") === "true" });
  if (error) return { error: error.message };
  refresh();
  return { success: t("admin.community.done") };
}
