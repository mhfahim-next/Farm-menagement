import "server-only";
import { revalidatePath } from "next/cache";
import type { FarmContext } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import type { ActionState } from "@/lib/types";

export type EntryKind = "record_health" | "update_health" | "renew_health" | "log_breeding" | "update_breeding";
export const ENTRY_KINDS: EntryKind[] = ["record_health", "update_health", "renew_health", "log_breeding", "update_breeding"];

export type PendingEntry = {
  id: string;
  farm_id: string;
  submitted_by: string | null;
  kind: EntryKind;
  payload: [string, string][];
  status: "pending" | "approved" | "rejected";
  note: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
};

/** The form fields of a payload as a lookup (first value wins; use `all` for repeated ones). */
export function fieldsOf(payload: [string, string][]) {
  const get = (k: string) => payload.find(([n]) => n === k)?.[1] ?? null;
  const all = (k: string) => payload.filter(([n]) => n === k).map(([, v]) => v);
  return { get, all };
}

/**
 * For a vet, a health or breeding form is not saved: it is queued for the
 * farm owner / manager to approve first. Returns the result to show, or null
 * when the user is not a vet and the action should save normally.
 */
export async function queueIfVet(
  ctx: Pick<FarmContext, "supabase" | "farm" | "role">,
  kind: EntryKind,
  formData: FormData,
): Promise<ActionState | null> {
  if (ctx.role !== "vet") return null;
  const { t } = await getI18n();

  const payload: [string, string][] = [];
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string" && v !== "" && payload.length < 120 && v.length <= 2000) payload.push([k, v]);
  }
  const { get, all } = fieldsOf(payload);
  // Light checks so the owner never gets an empty entry; the full rules run again on approval.
  const missing =
    (kind === "record_health" && (all("cattle_id").length === 0 || !get("product") || !get("record_type") || !get("record_date"))) ||
    (kind === "update_health" && (!get("id") || !get("product") || !get("record_date"))) ||
    (kind === "renew_health" && !get("id")) ||
    (kind === "log_breeding" && (!get("cattle_id") || !get("event_type") || !get("event_date"))) ||
    (kind === "update_breeding" && (!get("id") || !get("event_date")));
  if (missing) return { error: t("approvals.err.incomplete") };

  const { error } = await ctx.supabase.from("pending_entries").insert({ farm_id: ctx.farm.id, kind, payload });
  if (error) return { error: error.code === "23514" ? t("approvals.err.tooMany") : t("common.errorGeneric") };

  revalidatePath("/dashboard", "layout");
  return { success: t("approvals.sent") };
}
