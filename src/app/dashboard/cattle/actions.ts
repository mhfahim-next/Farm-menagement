"use server";

import { revalidatePath } from "next/cache";
import { MANAGERS, requireRole, STAFF } from "@/lib/auth";
import { dbError, num, str } from "@/lib/form";
import { getI18n } from "@/lib/i18n/server";
import type { ActionState } from "@/lib/types";

/**
 * Checks the chosen mother (empty = unknown). The database enforces the same
 * rules; checking here gives a clear message.
 */
async function validateMother(
  supabase: Awaited<ReturnType<typeof requireRole>>["supabase"],
  farmId: string,
  motherId: string | null,
  selfId: string | null,
  t: Awaited<ReturnType<typeof getI18n>>["t"],
) {
  if (!motherId) return null;
  if (motherId === selfId) return t("cattle.motherSelf");
  const { data } = await supabase
    .from("cattle")
    .select("sex")
    .eq("id", motherId)
    .eq("farm_id", farmId)
    .maybeSingle();
  return data?.sex === "female" ? null : t("cattle.motherNotFemale");
}

export async function addCattle(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireRole(STAFF);
  const { t } = await getI18n();
  const tag = str(formData, "tag_number");
  if (!tag) return { error: t("cattle.tagRequired") };
  const category = str(formData, "category");
  if (!category) return { error: t("cattle.typeUnknown") };

  const motherId = str(formData, "mother_id");
  const motherError = await validateMother(supabase, farm.id, motherId, null, t);
  if (motherError) return { error: motherError };

  const { error } = await supabase.from("cattle").insert({
    farm_id: farm.id,
    tag_number: tag,
    name: str(formData, "name"),
    breed: str(formData, "breed"),
    // sex is set by the database from the animal type
    category,
    date_of_birth: str(formData, "date_of_birth"),
    purchase_date: str(formData, "purchase_date"),
    purchase_price: num(formData, "purchase_price"),
    mother_id: motherId,
    father: str(formData, "father"),
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
  const { supabase, farm } = await requireRole(STAFF);
  const { t } = await getI18n();
  const id = str(formData, "id");
  if (!id) return { error: t("cattle.missing") };

  const motherId = str(formData, "mother_id");
  const motherError = await validateMother(supabase, farm.id, motherId, id, t);
  if (motherError) return { error: motherError };

  const { error } = await supabase
    .from("cattle")
    .update({
      name: str(formData, "name"),
      breed: str(formData, "breed"),
      ...(str(formData, "category") ? { category: str(formData, "category")! } : {}),
      status: str(formData, "status") ?? "active",
      date_of_birth: str(formData, "date_of_birth"),
      mother_id: motherId,
      father: str(formData, "father"),
      notes: str(formData, "notes"),
    })
    .eq("id", id)
    .eq("farm_id", farm.id);
  if (error) return { error: dbError(t, error) };

  revalidatePath(`/dashboard/cattle/${id}`);
  revalidatePath("/dashboard/cattle");
  return { success: t("cattle.saved") };
}

async function setStatus(formData: FormData, status: "archived" | "active"): Promise<ActionState> {
  const { supabase, farm } = await requireRole(STAFF);
  const { t } = await getI18n();
  const id = str(formData, "id");
  if (!id) return { error: t("cattle.missing") };

  const { data, error } = await supabase
    .from("cattle")
    .update({ status })
    .eq("id", id)
    .eq("farm_id", farm.id)
    .select("tag_number");
  if (error) return { error: dbError(t, error) };
  if (!data?.length) return { error: t("cattle.missing") };

  revalidatePath("/dashboard", "layout");
  return { success: t(status === "archived" ? "cattle.archivedToast" : "cattle.restoredToast", { tag: data[0].tag_number }) };
}

/** Hides an animal from lists and pickers but keeps all its records. */
export async function archiveCattle(_: ActionState, formData: FormData): Promise<ActionState> {
  return setStatus(formData, "archived");
}

/** Brings an archived animal back (the plan limit is checked by the database). */
export async function restoreCattle(_: ActionState, formData: FormData): Promise<ActionState> {
  return setStatus(formData, "active");
}

/** Permanently deletes an animal with its milk, health and breeding records. Owners and managers only. */
export async function deleteCattle(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireRole(MANAGERS);
  const { t } = await getI18n();
  const id = str(formData, "id");
  if (!id) return { error: t("cattle.missing") };

  const { data, error } = await supabase
    .from("cattle")
    .delete()
    .eq("id", id)
    .eq("farm_id", farm.id)
    .select("tag_number");
  if (error) return { error: dbError(t, error) };
  if (!data?.length) return { error: t("cattle.missing") };

  revalidatePath("/dashboard", "layout");
  return { success: t("cattle.deletedToast", { tag: data[0].tag_number }) };
}
