"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { FARM_COOKIE, requireDoctor } from "@/lib/auth";
import { str } from "@/lib/form";
import { getI18n } from "@/lib/i18n/server";
import type { ActionState } from "@/lib/types";

/** A doctor stops serving a farm. */
export async function leaveFarmById(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireDoctor();
  const { t } = await getI18n();
  const farmId = str(formData, "farm_id");
  if (!farmId) return { error: t("common.errorGeneric") };

  const { error } = await supabase.rpc("leave_farm", { p_farm: farmId });
  if (error) return { error: t("team.err.forbidden") };

  // If that was the farm on screen, forget it.
  const jar = await cookies();
  if (jar.get(FARM_COOKIE)?.value === farmId) jar.delete(FARM_COOKIE);
  revalidatePath("/", "layout");
  return { success: t("team.left") };
}
