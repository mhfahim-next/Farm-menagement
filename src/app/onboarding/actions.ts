"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { dbError, str } from "@/lib/form";
import { getI18n } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";

export async function createFarm(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const { t } = await getI18n();

  const name = str(formData, "name");
  const hasDairy = formData.get("has_dairy") === "on";
  const hasLayer = formData.get("has_layer") === "on";
  if (!name || name.length < 2) return { error: t("onboarding.enterName") };
  if (!hasDairy && !hasLayer) return { error: t("onboarding.chooseType") };

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_farm", {
    p_name: name,
    p_location: str(formData, "location"),
    p_currency: str(formData, "currency") ?? "BDT",
    p_has_dairy: hasDairy,
    p_has_layer: hasLayer,
  });
  if (error) return { error: dbError(t, error) };

  redirect("/dashboard");
}
