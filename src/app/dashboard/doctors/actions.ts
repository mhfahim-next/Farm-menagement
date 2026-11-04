"use server";

import { revalidatePath } from "next/cache";
import { MANAGERS, requireRole } from "@/lib/auth";
import { dbError, str } from "@/lib/form";
import { getI18n } from "@/lib/i18n/server";
import type { ActionState } from "@/lib/types";

/** Invite a doctor from the list to this farm as its vet (the doctor accepts in their account). */
export async function inviteListedDoctor(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireRole(MANAGERS);
  const { t } = await getI18n();
  const doctor = str(formData, "doctor");
  if (!doctor || !/^[0-9a-f-]{36}$/i.test(doctor)) return { error: t("common.errorGeneric") };
  const { data, error } = await supabase.rpc("invite_listed_doctor", { p_farm: farm.id, p_doctor: doctor });
  if (error) {
    if (error.message.includes("DOCTOR_NOT_FOUND")) return { error: t("vets.err.notFound") };
    if (error.message.includes("TOO_MANY_INVITES")) return { error: t("vets.err.tooMany") };
    return { error: dbError(t, error) };
  }
  revalidatePath("/dashboard/settings");
  if (data === "member") return { success: t("vets.alreadyMember") };
  if (data === "pending") return { success: t("vets.alreadyInvited") };
  return { success: t("vets.invited") };
}
