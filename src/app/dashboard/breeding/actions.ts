"use server";

import { revalidatePath } from "next/cache";
import { requireFarm } from "@/lib/auth";
import { dbError, num, str } from "@/lib/form";
import { addDays, GESTATION_DAYS } from "@/lib/breeding";
import { today } from "@/lib/format";
import type { ActionState } from "@/lib/types";

const EVENT_TYPES = ["heat", "insemination", "pregnancy_check", "calving", "dry_off"];
const PREGNANCY_RESULTS = ["positive", "negative", "uncertain"];

export async function logBreedingEvent(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireFarm();

  const cattleId = str(formData, "cattle_id");
  const eventType = str(formData, "event_type");
  const eventDate = str(formData, "event_date");
  if (!cattleId) return { error: "Choose the cow." };
  if (!eventType || !EVENT_TYPES.includes(eventType)) return { error: "Choose the event type." };
  if (!eventDate) return { error: "Choose the date." };
  if (eventDate > today()) return { error: "The date can't be in the future." };

  const result = eventType === "pregnancy_check" ? (str(formData, "result")?.toLowerCase() ?? null) : null;
  if (eventType === "pregnancy_check" && (!result || !PREGNANCY_RESULTS.includes(result))) {
    return { error: "Choose the pregnancy check result." };
  }

  let expected = str(formData, "expected_calving_date");
  if (!expected && eventType === "insemination") expected = addDays(eventDate, GESTATION_DAYS);

  const heatSigns = formData
    .getAll("heat_sign")
    .filter((v): v is string => typeof v === "string" && v !== "")
    .join(", ");

  const { error } = await supabase.from("breeding_events").insert({
    farm_id: farm.id,
    cattle_id: cattleId,
    event_type: eventType,
    event_date: eventDate,
    bull_or_semen: str(formData, "bull_or_semen"),
    technician: str(formData, "technician"),
    cost: num(formData, "cost"),
    heat_signs: heatSigns || null,
    result,
    expected_calving_date: eventType === "insemination" ? expected : null,
    notes: str(formData, "notes"),
  });
  if (error) return { error: dbError(error) };

  let message = "Saved.";
  if (eventType === "calving") {
    message = "Calving recorded.";
    const calfTag = str(formData, "calf_tag");

    // A heifer becomes a cow once she has calved.
    await supabase
      .from("cattle")
      .update({ category: "cow" })
      .eq("id", cattleId)
      .eq("farm_id", farm.id)
      .eq("category", "heifer");

    if (calfTag) {
      const { data: dam } = await supabase.from("cattle").select("breed").eq("id", cattleId).eq("farm_id", farm.id).maybeSingle();
      const { error: calfError } = await supabase.from("cattle").insert({
        farm_id: farm.id,
        tag_number: calfTag,
        name: str(formData, "calf_name"),
        sex: str(formData, "calf_sex") === "male" ? "male" : "female",
        category: "calf",
        breed: dam?.breed ?? null,
        date_of_birth: eventDate,
        mother_id: cattleId,
      });
      if (calfError) {
        revalidatePath("/dashboard", "layout");
        return {
          error:
            calfError.code === "23505"
              ? `Calving was saved, but tag ${calfTag} is already used — add the calf from the Cattle page.`
              : `Calving was saved, but the calf could not be added: ${dbError(calfError)}`,
        };
      }
      message = `Calving recorded and calf ${calfTag} added to the herd.`;
    }
  } else if (eventType === "insemination" && expected) {
    message = `Insemination recorded. Expected calving ${expected}.`;
  } else if (eventType === "heat") {
    message = `Heat recorded. Next heat expected around ${addDays(eventDate, 21)}.`;
  }

  revalidatePath("/dashboard", "layout");
  return { success: message };
}
