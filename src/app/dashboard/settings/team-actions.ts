"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { FARM_COOKIE, MANAGERS, requireFarm, requireRole } from "@/lib/auth";
import { dbError, str } from "@/lib/form";
import { getI18n } from "@/lib/i18n/server";
import type { ActionState } from "@/lib/types";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function inviteMember(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireRole(MANAGERS);
  const { t } = await getI18n();
  const email = str(formData, "email")?.toLowerCase();
  const role = str(formData, "role");
  if (!email || !EMAIL.test(email)) return { error: t("team.err.email") };
  if (!role || !["manager", "worker", "vet"].includes(role)) return { error: t("common.errorGeneric") };

  const { error } = await supabase.from("farm_invites").insert({ farm_id: farm.id, email, role });
  if (error) {
    if (error.message.includes("ALREADY_MEMBER")) return { error: t("team.err.alreadyMember") };
    if (error.code === "23505") return { error: t("team.err.duplicate") };
    if (error.code === "42501" || error.code === "PGRST301") return { error: t("team.err.onlyOwnerManager") };
    if (error.code === "23514" && !error.message.startsWith("PLAN_LIMIT")) return { error: t("team.err.email") };
    return { error: dbError(t, error) };
  }

  revalidatePath("/dashboard/settings");
  return { success: t("team.invited", { email }) };
}

export async function revokeInvite(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireRole(MANAGERS);
  const { t } = await getI18n();
  const id = str(formData, "id");
  if (!id) return { error: t("common.errorGeneric") };
  const { error } = await supabase.rpc("revoke_farm_invite", { p_id: id });
  if (error) return { error: t("team.err.forbidden") };
  revalidatePath("/dashboard/settings");
  return { success: t("team.revoked") };
}

/** The owner removes someone from the farm. */
export async function removeMember(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm, role } = await requireFarm();
  const { t } = await getI18n();
  const userId = str(formData, "user_id");
  if (role !== "owner" || !userId) return { error: t("team.err.forbidden") };

  const { data, error } = await supabase
    .from("farm_members")
    .delete()
    .eq("farm_id", farm.id)
    .eq("user_id", userId)
    .neq("role", "owner")
    .select("user_id");
  if (error || !data?.length) return { error: t("team.err.forbidden") };

  revalidatePath("/", "layout");
  return { success: t("team.removed") };
}

/** A non-owner leaves the farm they are viewing. */
export async function leaveFarm(): Promise<ActionState> {
  const { supabase, farm } = await requireFarm();
  const { t } = await getI18n();
  const { error } = await supabase.rpc("leave_farm", { p_farm: farm.id });
  if (error) return { error: t("team.ownerCannotLeave") };

  (await cookies()).delete(FARM_COOKIE);
  revalidatePath("/", "layout");
  return { success: t("team.left") };
}
