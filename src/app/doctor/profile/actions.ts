"use server";

import { revalidatePath } from "next/cache";
import { requireDoctor } from "@/lib/auth";
import { districtByKey } from "@/lib/districts";
import { dbError, str } from "@/lib/form";
import { getI18n } from "@/lib/i18n/server";
import type { ActionState } from "@/lib/types";

export async function updateDoctorDetails(_: ActionState, formData: FormData): Promise<ActionState> {
  const { user, supabase } = await requireDoctor();
  const { t } = await getI18n();
  const regNo = str(formData, "doctor_reg_no");
  if (!regNo) return { error: t("doctor.regRequired") };

  const listing =
    formData.has("doctor_district") || formData.has("doctor_area")
      ? {
          doctor_district: districtByKey(str(formData, "doctor_district"))?.key ?? null,
          doctor_area: str(formData, "doctor_area")?.slice(0, 80) ?? null,
          doctor_listed: formData.get("doctor_listed") === "on",
          doctor_show_phone: formData.get("doctor_show_phone") === "on",
        }
      : {};
  const { error } = await supabase
    .from("profiles")
    .update({ doctor_reg_no: regNo, doctor_specialty: str(formData, "doctor_specialty"), ...listing })
    .eq("id", user.id);
  if (error) return { error: dbError(t, error) };

  revalidatePath("/", "layout");
  return { success: t("doctor.detailsSaved") };
}
