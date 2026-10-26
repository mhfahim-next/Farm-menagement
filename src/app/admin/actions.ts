"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth";
import { str } from "@/lib/form";
import { getI18n } from "@/lib/i18n/server";
import type { ActionState } from "@/lib/types";

/**
 * Every admin action: confirm the caller is a super admin (404 otherwise),
 * then call the matching admin_* Postgres function, which checks again and
 * writes the audit log entry.
 */
async function run(
  rpc: (supabase: Awaited<ReturnType<typeof requireSuperAdmin>>["supabase"]) => PromiseLike<{ error: { message: string } | null }>,
  success: string,
): Promise<ActionState> {
  const { supabase } = await requireSuperAdmin();
  const { error } = await rpc(supabase);
  if (error) return { error: error.message };
  revalidatePath("/admin", "layout");
  return { success };
}

export async function setUserBanned(_: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const id = str(formData, "id");
  if (!id) return { error: t("common.errorGeneric") };
  return run((s) => s.rpc("admin_set_user_banned", { p_user: id, p_banned: formData.get("banned") === "true" }), t("admin.actionDone"));
}

export async function setSuperAdmin(_: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const id = str(formData, "id");
  if (!id) return { error: t("common.errorGeneric") };
  return run((s) => s.rpc("admin_set_super_admin", { p_user: id, p_value: formData.get("value") === "true" }), t("admin.actionDone"));
}

export async function deleteUser(_: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const id = str(formData, "id");
  if (!id) return { error: t("common.errorGeneric") };
  return run((s) => s.rpc("admin_delete_user", { p_user: id }), t("admin.actionDone"));
}

export async function setFarmPlan(_: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const id = str(formData, "id");
  const plan = str(formData, "plan");
  if (!id || !plan) return { error: t("common.errorGeneric") };
  return run((s) => s.rpc("admin_set_farm_plan", { p_farm: id, p_plan: plan }), t("admin.planUpdated"));
}

export async function setFarmSuspended(_: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const id = str(formData, "id");
  if (!id) return { error: t("common.errorGeneric") };
  return run((s) => s.rpc("admin_set_farm_suspended", { p_farm: id, p_suspended: formData.get("suspended") === "true" }), t("admin.actionDone"));
}

export async function deleteFarm(_: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const id = str(formData, "id");
  if (!id) return { error: t("common.errorGeneric") };
  return run((s) => s.rpc("admin_delete_farm", { p_farm: id }), t("admin.actionDone"));
}

export async function saveAnnouncement(_: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  return run(
    (s) =>
      s.rpc("admin_set_announcement", {
        p_en: str(formData, "announcement_en") ?? "",
        p_bn: str(formData, "announcement_bn") ?? "",
        p_active: formData.get("active") === "on",
      }),
    t("admin.announceSaved"),
  );
}

export async function setDoctorVerified(_: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const id = str(formData, "id");
  if (!id) return { error: t("common.errorGeneric") };
  return run((s) => s.rpc("admin_set_doctor_verified", { p_user: id, p_value: formData.get("value") === "true" }), t("admin.actionDone"));
}

/** Approve/decline an upgrade request, or mark a support message answered. */
export async function resolveRequest(id: string, approve: boolean, reply: string): Promise<ActionState> {
  const { t } = await getI18n();
  const { supabase } = await requireSuperAdmin();
  const { error } = await supabase.rpc("admin_resolve_request", { p_id: id, p_approve: approve, p_reply: reply });
  if (error) {
    return { error: error.message.includes("already been handled") ? t("admin.requests.notFound") : error.message };
  }
  revalidatePath("/admin", "layout");
  return { success: t("admin.requests.done") };
}

export async function saveBreedingRules(_: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const n = (k: string) => Number(str(formData, k));
  const [check, gestation, heat, dry, wait] = [
    n("pregnancy_check_days"), n("gestation_days"), n("heat_cycle_days"), n("dry_off_days"), n("voluntary_wait_days"),
  ];
  const ok = (v: number, lo: number, hi: number) => Number.isInteger(v) && v >= lo && v <= hi;
  if (!ok(check, 20, 120) || !ok(gestation, 240, 320) || !ok(heat, 14, 30) || !ok(dry, 30, 90) || !ok(wait, 20, 150)) {
    return { error: t("admin.breedingRules.invalid") };
  }
  return run(
    (s) => s.rpc("admin_set_breeding_rules", { p_check: check, p_gestation: gestation, p_heat: heat, p_dry: dry, p_wait: wait }),
    t("admin.breedingRules.saved"),
  );
}

/** Goat / sheep gestation and the Eid-ul-Adha date (fattening pages count down to it). */
export async function saveLivestockRules(_: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const goat = Number(str(formData, "goat_gestation_days"));
  const sheep = Number(str(formData, "sheep_gestation_days"));
  const ok = (v: number) => Number.isInteger(v) && v >= 130 && v <= 170;
  if (!ok(goat) || !ok(sheep)) return { error: t("admin.breedingRules.invalid") };
  return run(
    (s) => s.rpc("admin_set_livestock_rules", { p_goat: goat, p_sheep: sheep, p_qurbani: str(formData, "qurbani_date") }),
    t("adminlive.saved"),
  );
}

/** Super admin: sends a test error to Sentry from the server, to check the setup. */
export async function sendSentryTest(): Promise<ActionState> {
  await requireSuperAdmin();
  const { t } = await getI18n();
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN && !process.env.SENTRY_DSN) return { error: t("adminsentry.off") };
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureException(new Error("FarmFlows Sentry test (server)"));
  return (await Sentry.flush(5000)) ? { success: t("adminsentry.sent") } : { error: t("adminsentry.failed") };
}
