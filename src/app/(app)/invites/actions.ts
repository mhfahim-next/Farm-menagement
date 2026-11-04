"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FARM_COOKIE, requireUser } from "@/lib/auth";
import { dbError, str } from "@/lib/form";
import { getI18n } from "@/lib/i18n/server";
import type { MessageKey } from "@/lib/i18n/core";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";

const ERRORS: Record<string, MessageKey> = {
  INVITE_NOT_FOUND: "invites.err.notFound",
  VET_NEEDS_DOCTOR_ACCOUNT: "invites.err.needDoctor",
  DOCTOR_CANNOT_STAFF: "invites.err.doctorStaff",
};

/** Accept or decline a farm invitation addressed to the signed-in user's email. */
export async function respondInvite(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const { t } = await getI18n();
  const id = str(formData, "id");
  const accept = formData.get("accept") === "true";
  const farmId = str(formData, "farm_id");
  const farmName = str(formData, "farm_name") ?? "";
  const role = str(formData, "role");
  if (!id) return { error: t("common.errorGeneric") };

  const supabase = await createClient();
  const { error } = await supabase.rpc("respond_farm_invite", { p_id: id, p_accept: accept });
  if (error) {
    const code = Object.keys(ERRORS).find((c) => error.message.includes(c));
    return { error: code ? t(ERRORS[code]) : dbError(t, error) };
  }

  revalidatePath("/", "layout");
  if (!accept) return { success: t("invites.declined") };

  // Show the farm they just joined.
  if (farmId) {
    (await cookies()).set(FARM_COOKIE, farmId, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  }
  void farmName;
  redirect(role === "vet" ? "/doctor" : "/dashboard");
}
