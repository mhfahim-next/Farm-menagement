"use server";

import { revalidatePath } from "next/cache";
import { requireFarm, requireUser } from "@/lib/auth";
import { dbError, str } from "@/lib/form";
import { getI18n } from "@/lib/i18n/server";
import { pushHostAllowed, pushReady, sendPush } from "@/lib/notify";
import { createClient } from "@/lib/supabase/server";
import { isReminderGroup } from "@/lib/reminders";
import type { ActionState } from "@/lib/types";

const KEY = /^[a-z_]+:[A-Za-z0-9:_-]{1,180}$/;

/** "Done": hides one reminder for this person on this farm. */
export async function dismissReminder(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm, user } = await requireFarm();
  const { t } = await getI18n();
  const key = str(formData, "key") ?? "";
  if (!KEY.test(key)) return { error: t("common.errorGeneric") };
  const { error } = await supabase.from("reminder_dismissals").upsert({ user_id: user.id, farm_id: farm.id, key }, { onConflict: "user_id,farm_id,key", ignoreDuplicates: true });
  if (error) return { error: dbError(t, error) };
  revalidatePath("/dashboard", "layout");
  return { success: t("notif.doneOk") };
}

export async function undoReminder(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm, user } = await requireFarm();
  const { t } = await getI18n();
  const key = str(formData, "key") ?? "";
  const { error } = await supabase.from("reminder_dismissals").delete().match({ user_id: user.id, farm_id: farm.id, key });
  if (error) return { error: dbError(t, error) };
  revalidatePath("/dashboard", "layout");
  return { success: t("notif.undoOk") };
}

/** The person's own choices (applies on every farm they belong to). */
export async function saveReminderPrefs(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();
  const { t, locale } = await getI18n();
  const email = str(formData, "email") ?? "off";
  if (!["off", "daily", "weekly"].includes(email)) return { error: t("common.errorGeneric") };
  // Checked boxes are the groups the person wants; everything else offered is muted.
  const offered = formData.getAll("offered").map(String).filter(isReminderGroup);
  const wanted = new Set(formData.getAll("groups").map(String));
  const { error } = await supabase.from("notification_prefs").upsert({
    user_id: user.id,
    locale,
    morning: formData.get("morning") === "on",
    evening: formData.get("evening") === "on",
    email,
    muted: offered.filter((g) => !wanted.has(g)),
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: dbError(t, error) };
  revalidatePath("/dashboard", "layout");
  return { success: t("notif.saved") };
}

export type PushSub = { endpoint: string; keys: { p256dh: string; auth: string } };

/** Saves this browser's push subscription (and the language to write notifications in). */
export async function savePushSubscription(sub: PushSub, userAgent: string): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();
  const { t, locale } = await getI18n();
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth || !pushHostAllowed(sub.endpoint)) return { error: t("notif.pushFailed") };
  const { error } = await supabase.rpc("push_subscribe", {
    p_endpoint: sub.endpoint,
    p_p256dh: sub.keys.p256dh,
    p_auth: sub.keys.auth,
    p_user_agent: userAgent.slice(0, 300),
  });
  if (error) return { error: dbError(t, error) };
  // Keep the language in step; create the row with defaults if there is none.
  const { data: existing } = await supabase.from("notification_prefs").select("user_id").eq("user_id", user.id).maybeSingle();
  if (existing) await supabase.from("notification_prefs").update({ locale }).eq("user_id", user.id);
  else await supabase.from("notification_prefs").insert({ user_id: user.id, locale });
  revalidatePath("/dashboard/notifications");
  return { success: t("notif.pushOn") };
}

export async function removePushSubscription(endpoint: string): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();
  const { t } = await getI18n();
  const { error } = await supabase.from("push_subscriptions").delete().match({ user_id: user.id, endpoint });
  if (error) return { error: dbError(t, error) };
  revalidatePath("/dashboard/notifications");
  return { success: t("notif.saved") };
}

/** Sends a test notification to every browser this person turned on. */
export async function sendTestPush(): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();
  const { t } = await getI18n();
  if (!pushReady()) return { error: t("notif.pushOff") };
  const { data } = await supabase.from("push_subscriptions").select("id, endpoint, p256dh, auth").eq("user_id", user.id);
  if (!data?.length) return { error: t("notif.pushNoDevice") };
  const results = await Promise.all(
    data.map(async (d) => {
      const r = await sendPush(d, { title: t("rem.push.testTitle"), body: t("rem.push.testBody"), url: "/dashboard/notifications", tag: "ff-test" });
      if (r === "gone") await supabase.from("push_subscriptions").delete().eq("id", d.id);
      return r;
    }),
  );
  return results.includes("ok") ? { success: t("notif.pushTestSent") } : { error: t("notif.pushFailed") };
}
