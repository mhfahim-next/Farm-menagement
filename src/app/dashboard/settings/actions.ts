"use server";

import { revalidatePath } from "next/cache";
import { requireFarm } from "@/lib/auth";
import { dbError, str } from "@/lib/form";
import { getI18n } from "@/lib/i18n/server";
import type { ActionState } from "@/lib/types";

export async function updateFarm(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm, role } = await requireFarm();
  const { t } = await getI18n();
  if (role !== "owner" && role !== "manager") return { error: t("settings.onlyOwners") };

  const name = str(formData, "name");
  const hasDairy = formData.get("has_dairy") === "on";
  const hasLayer = formData.get("has_layer") === "on";
  if (!name) return { error: t("settings.nameRequired") };
  if (!hasDairy && !hasLayer) return { error: t("settings.keepOne") };

  const { error } = await supabase
    .from("farms")
    .update({
      name,
      location: str(formData, "location"),
      currency: str(formData, "currency") ?? farm.currency,
      has_dairy: hasDairy,
      has_layer: hasLayer,
    })
    .eq("id", farm.id);
  if (error) return { error: dbError(t, error) };

  revalidatePath("/dashboard", "layout");
  return { success: t("settings.saved") };
}
