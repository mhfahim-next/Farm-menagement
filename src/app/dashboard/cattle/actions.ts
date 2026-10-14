"use server";

import { revalidatePath } from "next/cache";
import { requireFarm } from "@/lib/auth";
import { dbError, num, str } from "@/lib/form";
import { getI18n } from "@/lib/i18n/server";
import type { ActionState } from "@/lib/types";

export async function addCattle(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireFarm();
  const { t } = await getI18n();
  const tag = str(formData, "tag_number");
  if (!tag) return { error: t("cattle.tagRequired") };

  const { error } = await supabase.from("cattle").insert({
    farm_id: farm.id,
    tag_number: tag,
    name: str(formData, "name"),
    breed: str(formData, "breed"),
    sex: str(formData, "sex") ?? "female",
    category: str(formData, "category") ?? "cow",
    date_of_birth: str(formData, "date_of_birth"),
    purchase_date: str(formData, "purchase_date"),
    purchase_price: num(formData, "purchase_price"),
    notes: str(formData, "notes"),
  });
  if (error) {
    return {
      error: error.code === "23505" ? t("cattle.dupTag", { tag }) : dbError(t, error),
    };
  }

  revalidatePath("/dashboard", "layout");
  return { success: t("cattle.added", { tag }) };
}

export async function updateCattle(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireFarm();
  const { t } = await getI18n();
  const id = str(formData, "id");
  if (!id) return { error: t("cattle.missing") };

  const { error } = await supabase
    .from("cattle")
    .update({
      name: str(formData, "name"),
      breed: str(formData, "breed"),
      category: str(formData, "category") ?? "cow",
      status: str(formData, "status") ?? "active",
      date_of_birth: str(formData, "date_of_birth"),
      notes: str(formData, "notes"),
    })
    .eq("id", id)
    .eq("farm_id", farm.id);
  if (error) return { error: dbError(t, error) };

  revalidatePath(`/dashboard/cattle/${id}`);
  revalidatePath("/dashboard/cattle");
  return { success: t("cattle.saved") };
}
