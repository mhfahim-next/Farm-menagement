"use server";

import { revalidatePath } from "next/cache";
import { requireDoctor } from "@/lib/auth";
import { dbError, str } from "@/lib/form";
import { getI18n } from "@/lib/i18n/server";
import type { ActionState } from "@/lib/types";

export async function updateDoctorDetails(_: ActionState, formData: FormData): Promise<ActionState> {
  const { user, supabase } = await requireDoctor();
  const { t } = await getI18n();
  const regNo = str(formData, "doctor_reg_no");
  if (!regNo) return { error: t("doctor.regRequired") };

  const { error } = await supabase
    .from("profiles")
    .update({ doctor_reg_no: regNo, doctor_specialty: str(formData, "doctor_specialty") })
    .eq("id", user.id);
  if (error) return { error: dbError(t, error) };

  revalidatePath("/", "layout");
  return { success: t("doctor.detailsSaved") };
}
