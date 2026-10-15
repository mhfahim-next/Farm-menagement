"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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
  const hasDairy = formData.get("has_dairy") === "on";
  const hasLayer = formData.get("has_layer") === "on";
  if (!name || name.length < 2) return { error: t("onboarding.enterName") };
  if (!hasDairy && !hasLayer) return { error: t("onboarding.chooseType") };

  const supabase = await createClient();
  const { data: farmId, error } = await supabase.rpc("create_farm", {
    p_name: name,
    p_location: str(formData, "location"),
    p_currency: str(formData, "currency") ?? "BDT",
    p_has_dairy: hasDairy,
    p_has_layer: hasLayer,
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
