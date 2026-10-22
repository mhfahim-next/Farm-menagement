"use server";

import { revalidatePath } from "next/cache";
import { queueIfVet } from "@/lib/approvals";
import { MANAGERS, requireFarm, requireRole } from "@/lib/auth";
import { dbError, num, str } from "@/lib/form";
import { addDays } from "@/lib/breeding";
import { getBreedingRules } from "@/lib/breeding-data";
import { today } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import type { ActionState } from "@/lib/types";

const EVENT_TYPES = ["heat", "insemination", "pregnancy_check", "calving", "dry_off"];
const PREGNANCY_RESULTS = ["positive", "negative", "uncertain"];

/** Optional "HH:MM" from a time input; anything else is ignored as empty. */
function timeOf(formData: FormData) {
  const v = str(formData, "event_time");
  return v && /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? v : null;
}

export async function logBreedingEvent(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm, role } = await requireFarm();
  const { t, f } = await getI18n();
  const queued = await queueIfVet({ supabase, farm, role }, "log_breeding", formData);
  if (queued) return queued;

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
  if (!expected && eventType === "insemination") expected = addDays(eventDate, (await getBreedingRules({ supabase })).gestationDays);

  const heatSigns = formData
    .getAll("heat_sign")
    .filter((v): v is string => typeof v === "string" && v !== "")
    .join(", ");

  const { error } = await supabase.from("breeding_events").insert({
    farm_id: farm.id,
    cattle_id: cattleId,
    event_type: eventType,
    event_date: eventDate,
    event_time: timeOf(formData),
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

    // A heifer becomes a cow once she has calved (skipped if "cow" was hidden
    // by an admin; the database then refuses the change).
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
        // Sex comes from the chosen type (database trigger).
        category: str(formData, "calf_category") ?? "heifer",
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
    message = t("breeding.heatSaved", { date: f.date(addDays(eventDate, (await getBreedingRules({ supabase })).heatCycleDays)) });
  }

  revalidatePath("/dashboard", "layout");
  return { success: message };
}

/** Edits an existing event. The event type is fixed (a calving also created a calf, a heat has no result, …). */
export async function updateBreedingEvent(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm, role } = await requireFarm();
  const { t } = await getI18n();
  const queued = await queueIfVet({ supabase, farm, role }, "update_breeding", formData);
  if (queued) return queued;

  const id = str(formData, "id");
  const eventDate = str(formData, "event_date");
  if (!id) return { error: t("common.errorGeneric") };
  if (!eventDate) return { error: t("breeding.chooseDate") };
  if (eventDate > today()) return { error: t("breeding.dateFuture") };

  const { data: existing } = await supabase
    .from("breeding_events")
    .select("event_type")
    .eq("id", id)
    .eq("farm_id", farm.id)
    .maybeSingle();
  if (!existing) return { error: t("breeding.recordMissing") };
  const eventType = existing.event_type as string;

  const result = eventType === "pregnancy_check" ? (str(formData, "result")?.toLowerCase() ?? null) : null;
  if (eventType === "pregnancy_check" && (!result || !PREGNANCY_RESULTS.includes(result))) {
    return { error: t("breeding.chooseResultError") };
  }

  let expected: string | null = null;
  if (eventType === "insemination") expected = str(formData, "expected_calving_date") ?? addDays(eventDate, (await getBreedingRules({ supabase })).gestationDays);

  const heatSigns = formData
    .getAll("heat_sign")
    .filter((v): v is string => typeof v === "string" && v !== "")
    .join(", ");

  const { error } = await supabase
    .from("breeding_events")
    .update({
      event_date: eventDate,
      event_time: timeOf(formData),
      bull_or_semen: eventType === "insemination" ? str(formData, "bull_or_semen") : null,
      technician: eventType === "insemination" || eventType === "pregnancy_check" ? str(formData, "technician") : null,
      cost: eventType === "insemination" ? num(formData, "cost") : null,
      heat_signs: eventType === "heat" ? heatSigns || null : null,
      result,
      expected_calving_date: expected,
      notes: str(formData, "notes"),
    })
    .eq("id", id)
    .eq("farm_id", farm.id);
  if (error) return { error: dbError(t, error) };

  revalidatePath("/dashboard", "layout");
  return { success: t("breeding.updated") };
}

/**
 * Removes one breeding event (owners and managers). A calf registered from a calving
 * stays in the herd; only the event goes.
 */
export async function deleteBreedingEvent(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireRole(MANAGERS);
  const { t } = await getI18n();
  const id = str(formData, "id");
  if (!id) return { error: t("common.errorGeneric") };
  const { error } = await supabase.from("breeding_events").delete().eq("id", id).eq("farm_id", farm.id);
  if (error) return { error: dbError(t, error) };
  revalidatePath("/dashboard", "layout");
  return { success: t("breeding.deleted") };
}
