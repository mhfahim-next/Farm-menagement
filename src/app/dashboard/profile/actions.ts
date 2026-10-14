"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { dbError, str } from "@/lib/form";
import { getI18n } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { SUPABASE_URL } from "@/lib/supabase/env";
import type { ActionState } from "@/lib/types";

export async function updateProfile(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const { t } = await getI18n();
  const fullName = str(formData, "full_name");
  if (!fullName) return { error: t("profile.nameRequired") };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, phone: str(formData, "phone") })
    .eq("id", user.id);
  if (error) return { error: dbError(t, error) };

  revalidatePath("/dashboard", "layout");
  return { success: t("profile.detailsSaved") };
}

export async function changePassword(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const { t } = await getI18n();
  const password = str(formData, "password");
  const confirm = str(formData, "confirm");
  if (!password || password.length < 8) return { error: t("profile.passwordShort") };
  if (password !== confirm) return { error: t("profile.passwordMismatch") };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  return { success: t("profile.passwordChanged") };
}

const AVATAR_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/avatars/`;

/**
 * Called after the browser has uploaded a photo to `avatars/<user id>/…`.
 * Only paths inside the caller's own folder are accepted.
 */
export async function saveAvatar(path: string): Promise<ActionState> {
  const user = await requireUser();
  const { t } = await getI18n();
  if (!path.startsWith(`${user.id}/`) || path.includes("..")) return { error: t("profile.photoFailed") };

  const supabase = await createClient();
  const { data: before } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).maybeSingle();

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: AVATAR_PREFIX + path })
    .eq("id", user.id);
  if (error) return { error: dbError(t, error) };

  // Clean up the previous photo.
  const old = before?.avatar_url?.startsWith(AVATAR_PREFIX) ? before.avatar_url.slice(AVATAR_PREFIX.length) : null;
  if (old && old !== path && old.startsWith(`${user.id}/`)) {
    await supabase.storage.from("avatars").remove([old]);
  }

  revalidatePath("/dashboard", "layout");
  return { success: t("profile.photoSaved") };
}

export async function removeAvatar(): Promise<ActionState> {
  const user = await requireUser();
  const { t } = await getI18n();
  const supabase = await createClient();

  const { data: before } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).maybeSingle();
  const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
  if (error) return { error: dbError(t, error) };

  const old = before?.avatar_url?.startsWith(AVATAR_PREFIX) ? before.avatar_url.slice(AVATAR_PREFIX.length) : null;
  if (old && old.startsWith(`${user.id}/`)) await supabase.storage.from("avatars").remove([old]);

  revalidatePath("/dashboard", "layout");
  return { success: t("profile.photoRemoved") };
}
