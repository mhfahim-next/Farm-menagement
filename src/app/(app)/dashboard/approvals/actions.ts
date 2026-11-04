"use server";

import { revalidatePath } from "next/cache";
import { fieldsOf, ENTRY_KINDS, type EntryKind, type PendingEntry } from "@/lib/approvals";
import { MANAGERS, requireFarm, requireRole } from "@/lib/auth";
import { str } from "@/lib/form";
import { getI18n } from "@/lib/i18n/server";
import type { ActionState } from "@/lib/types";
import { logBreedingEvent, updateBreedingEvent } from "../breeding/actions";
import { recordHealth, renewHealth, updateHealth } from "../health/actions";

const RUNNERS: Record<EntryKind, (s: ActionState, fd: FormData) => Promise<ActionState>> = {
  record_health: recordHealth,
  update_health: updateHealth,
  renew_health: renewHealth,
  log_breeding: logBreedingEvent,
  update_breeding: updateBreedingEvent,
};

/** Owner / manager approves: the saved form runs through the same action a normal save uses. */
export async function approveEntry(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireRole(MANAGERS);
  const { t } = await getI18n();
  const id = str(formData, "id");
  if (!id) return { error: t("common.errorGeneric") };

  const { data, error } = await supabase.rpc("claim_pending_entry", { p_id: id });
  if (error) return { error: error.message.includes("ALREADY_HANDLED") ? t("approvals.err.handled") : t("common.errorGeneric") };
  const entry = data as PendingEntry;
  if (entry.farm_id !== farm.id || !ENTRY_KINDS.includes(entry.kind)) {
    await supabase.rpc("release_pending_entry", { p_id: id });
    return { error: t("common.errorGeneric") };
  }

  const fd = new FormData();
  for (const [k, v] of entry.payload) fd.append(k, v);

  // Keep the doctor's name on the record they proposed.
  if (entry.submitted_by) {
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", entry.submitted_by).maybeSingle();
    const name = profile?.full_name;
    const { get } = fieldsOf(entry.payload);
    if (name) {
      if ((entry.kind === "record_health" || entry.kind === "update_health") && !get("vet_name")) fd.set("vet_name", name);
      if ((entry.kind === "log_breeding" || entry.kind === "update_breeding") && !get("technician") && ["insemination", "pregnancy_check"].includes(get("event_type") ?? "")) {
        fd.set("technician", name);
      }
    }
  }

  const result = await RUNNERS[entry.kind](null, fd);
  if (result?.error) {
    await supabase.rpc("release_pending_entry", { p_id: id });
    return { error: result.error };
  }
  revalidatePath("/dashboard", "layout");
  return { success: t("approvals.approved") };
}

export async function rejectEntry(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireRole(MANAGERS);
  const { t } = await getI18n();
  const id = str(formData, "id");
  if (!id) return { error: t("common.errorGeneric") };
  const { error } = await supabase.rpc("reject_pending_entry", { p_id: id, p_note: str(formData, "note") ?? "" });
  if (error) return { error: error.message.includes("ALREADY_HANDLED") ? t("approvals.err.handled") : t("common.errorGeneric") };
  revalidatePath("/dashboard", "layout");
  return { success: t("approvals.rejected") };
}

/** A doctor withdraws an entry that is still waiting. */
export async function cancelEntry(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireFarm();
  const { t } = await getI18n();
  const id = str(formData, "id");
  if (!id) return { error: t("common.errorGeneric") };
  const { data, error } = await supabase.from("pending_entries").delete().eq("id", id).eq("farm_id", farm.id).eq("status", "pending").select("id");
  if (error || !data?.length) return { error: t("approvals.err.handled") };
  revalidatePath("/dashboard", "layout");
  return { success: t("approvals.cancelled") };
}
