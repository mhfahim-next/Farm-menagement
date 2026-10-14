"use server";

import { revalidatePath } from "next/cache";
import { requireFarm } from "@/lib/auth";
import { dbError, str } from "@/lib/form";
import type { ActionState } from "@/lib/types";

export async function updateFarm(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm, role } = await requireFarm();
  if (role !== "owner" && role !== "manager") return { error: "Only owners and managers can change farm settings." };

  const name = str(formData, "name");
  const hasDairy = formData.get("has_dairy") === "on";
  const hasLayer = formData.get("has_layer") === "on";
  if (!name) return { error: "Farm name is required." };
  if (!hasDairy && !hasLayer) return { error: "Keep at least one module enabled." };

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
  if (error) return { error: dbError(error) };

  revalidatePath("/dashboard", "layout");
  return { success: "Farm settings saved." };
}
