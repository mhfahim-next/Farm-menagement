"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readFarmKinds } from "@/components/farm-kind-fields";
import { FARM_COOKIE, getProfile, requireUser } from "@/lib/auth";
import { dbError, str } from "@/lib/form";
import { getI18n } from "@/lib/i18n/server";
import { getPlans } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";

/** Creates a farm (first one at sign-up, or another one on a plan that allows it). */
export async function createFarm(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const { t } = await getI18n();
  if ((await getProfile())?.account_type === "doctor") return { error: t("doctor.cannotCreateFarm") };

  const name = str(formData, "name");
  const kinds = readFarmKinds(formData);
  if (!name || name.length < 2) return { error: t("onboarding.enterName") };
  if (!Object.values(kinds).some(Boolean)) return { error: t("onboarding.chooseType") };

  const supabase = await createClient();
  const { data: farmId, error } = await supabase.rpc("create_farm", {
    p_name: name,
    p_location: str(formData, "location"),
    p_currency: str(formData, "currency") ?? "BDT",
    p_has_dairy: kinds.has_dairy,
    p_has_layer: kinds.has_layer,
    p_has_goat: kinds.has_goat,
    p_has_fattening: kinds.has_fattening,
    p_has_broiler: kinds.has_broiler,
  });
  if (error) {
    if (error.message.includes("DOCTOR_ACCOUNT")) return { error: t("doctor.cannotCreateFarm") };
    return { error: dbError(t, error) };
  }

  // Show the new farm straight away.
  if (farmId) {
    (await cookies()).set(FARM_COOKIE, farmId, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  }

  // Came from a paid plan on the home page: continue to that plan's upgrade request.
  const chosen = str(formData, "plan");
  if (chosen && chosen !== "free" && (await getPlans()).some((p) => p.key === chosen && p.active)) {
    redirect(`/dashboard/plan?choose=${encodeURIComponent(chosen)}`);
  }
  redirect("/dashboard");
}
