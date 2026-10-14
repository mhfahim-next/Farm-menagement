"use server";

import { revalidatePath } from "next/cache";
import { requireFarm } from "@/lib/auth";
import { dbError, num, str } from "@/lib/form";
import type { ActionState } from "@/lib/types";

const GESTATION_DAYS = 283;

export async function addCattle(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireFarm();
  const tag = str(formData, "tag_number");
  if (!tag) return { error: "Tag number is required." };

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
      error: error.code === "23505" ? `Tag ${tag} is already used on this farm.` : dbError(error),
    };
  }

  revalidatePath("/dashboard", "layout");
  return { success: `Added ${tag}.` };
}

export async function updateCattle(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireFarm();
  const id = str(formData, "id");
  if (!id) return { error: "Missing animal." };

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
  if (error) return { error: dbError(error) };

  revalidatePath(`/dashboard/cattle/${id}`);
  revalidatePath("/dashboard/cattle");
  return { success: "Saved." };
}

export async function addHealthRecord(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireFarm();
  const cattleId = str(formData, "cattle_id");
  const description = str(formData, "description");
  if (!cattleId || !description) return { error: "Describe what was done." };

  const { error } = await supabase.from("health_records").insert({
    farm_id: farm.id,
    cattle_id: cattleId,
    record_date: str(formData, "record_date"),
    record_type: str(formData, "record_type") ?? "treatment",
    description,
    medicine: str(formData, "medicine"),
    vet_name: str(formData, "vet_name"),
    cost: num(formData, "cost"),
    withdrawal_until: str(formData, "withdrawal_until"),
  });
  if (error) return { error: dbError(error) };

  revalidatePath(`/dashboard/cattle/${cattleId}`);
  return { success: "Health record added." };
}

export async function addBreedingEvent(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireFarm();
  const cattleId = str(formData, "cattle_id");
  const eventType = str(formData, "event_type");
  const eventDate = str(formData, "event_date");
  if (!cattleId || !eventType || !eventDate) return { error: "Event type and date are required." };

  let expected = str(formData, "expected_calving_date");
  if (!expected && eventType === "insemination") {
    const d = new Date(eventDate + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + GESTATION_DAYS);
    expected = d.toISOString().slice(0, 10);
  }

  const { error } = await supabase.from("breeding_events").insert({
    farm_id: farm.id,
    cattle_id: cattleId,
    event_type: eventType,
    event_date: eventDate,
    bull_or_semen: str(formData, "bull_or_semen"),
    result: str(formData, "result"),
    expected_calving_date: expected,
    notes: str(formData, "notes"),
  });
  if (error) return { error: dbError(error) };

  revalidatePath(`/dashboard/cattle/${cattleId}`);
  return { success: "Breeding event added." };
}
