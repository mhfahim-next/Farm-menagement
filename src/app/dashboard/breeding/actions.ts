"use server";

import { revalidatePath } from "next/cache";
import { requireFarm } from "@/lib/auth";
import { dbError, num, str } from "@/lib/form";
import { addDays, GESTATION_DAYS } from "@/lib/breeding";
import { today } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import type { ActionState } from "@/lib/types";

const EVENT_TYPES = ["heat", "insemination", "pregnancy_check", "calving", "dry_off"];
const PREGNANCY_RESULTS = ["positive", "negative", "uncertain"];

export async function logBreedingEvent(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireFarm();
  const { t, f } = await getI18n();

  const cattleId = str(formData, "cattle_id");
  const eventType = str(formData, "event_type");
  const eventDate = str(formData, "event_date");
  if (!cattleId) return { error: t("breeding.chooseCow") };
  if (!eventType || !EVENT_TYPES.includes(eventType)) return { error: t("breeding.chooseEventType") };
  if (!eventDate) return { error: t("breeding.chooseDate") };
  if (eventDate > today()) return { error: t("breeding.dateFuture") };

  const result = eventType === "pregnancy_check" ? (str(formData, "result")?.toLowerCase() ?? null) : null;
  if (eventType === "pregnancy_check" && (!result || !PREGNANCY_RESULTS.includes(result))) {
    return { error: t("breeding.chooseResultError") };
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
  if (error) return { error: dbError(t, error) };

  let message = t("breeding.saved");
  if (eventType === "calving") {
    message = t("breeding.calvingSaved");
    const calfTag = str(formData, "calf_tag");

    // A heifer becomes a cow once she has calved.
    await supabase
      .from("cattle")
      .update({ category: "cow" })
      .eq("id", cattleId)
      .eq("farm_id", farm.id)
      .eq("category", "heifer");

    if (calfTag) {
      const [{ data: dam }, { data: lastAi }] = await Promise.all([
        supabase.from("cattle").select("breed").eq("id", cattleId).eq("farm_id", farm.id).maybeSingle(),
        supabase
          .from("breeding_events")
          .select("bull_or_semen")
          .eq("cattle_id", cattleId)
          .eq("event_type", "insemination")
          .lte("event_date", eventDate)
          .order("event_date", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      const { error: calfError } = await supabase.from("cattle").insert({
        farm_id: farm.id,
        tag_number: calfTag,
        name: str(formData, "calf_name"),
        sex: str(formData, "calf_sex") === "male" ? "male" : "female",
        category: "calf",
        breed: dam?.breed ?? null,
        date_of_birth: eventDate,
        mother_id: cattleId,
        father: lastAi?.bull_or_semen ?? null,
      });
      if (calfError) {
        revalidatePath("/dashboard", "layout");
        return {
          error:
            calfError.code === "23505"
              ? t("breeding.calfDup", { tag: calfTag })
              : t("breeding.calfFailed", { error: dbError(t, calfError) }),
        };
      }
      message = t("breeding.calfAdded", { tag: calfTag });
    }
  } else if (eventType === "insemination" && expected) {
    message = t("breeding.aiSaved", { date: f.date(expected) });
  } else if (eventType === "heat") {
    message = t("breeding.heatSaved", { date: f.date(addDays(eventDate, 21)) });
  }

  revalidatePath("/dashboard", "layout");
  return { success: message };
}
