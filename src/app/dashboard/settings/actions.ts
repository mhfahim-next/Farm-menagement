"use server";

import { revalidatePath } from "next/cache";
import { readFarmKinds } from "@/components/farm-kind-fields";
import { requireFarm } from "@/lib/auth";
import { dbError, str } from "@/lib/form";
import { getI18n } from "@/lib/i18n/server";
import type { ActionState } from "@/lib/types";

export async function updateFarm(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm, role } = await requireFarm();
  const { t } = await getI18n();
  if (role !== "owner" && role !== "manager") return { error: t("settings.onlyOwners") };

  const name = str(formData, "name");
  const kinds = readFarmKinds(formData);
  if (!name) return { error: t("settings.nameRequired") };
  if (!Object.values(kinds).some(Boolean)) return { error: t("settings.keepOne") };

  const { error } = await supabase
    .from("farms")
    .update({
      name,
      location: str(formData, "location"),
      currency: str(formData, "currency") ?? farm.currency,
      ...kinds,
    })
    .eq("id", farm.id);
  if (error) return { error: dbError(t, error) };

  revalidatePath("/dashboard", "layout");
  return { success: t("settings.saved") };
}
