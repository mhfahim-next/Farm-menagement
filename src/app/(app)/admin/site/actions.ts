"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth";
import { str } from "@/lib/form";
import { getI18n } from "@/lib/i18n/server";
import { REVIEWS_TAG, SITE_TAG } from "@/lib/public-data";
import type { ActionState } from "@/lib/types";
import { revalidateSite } from "@/lib/revalidate-site";
import { youtubeId } from "@/lib/youtube";

/** Raw text (keeps line breaks and leading spaces, unlike str()). */
const text = (fd: FormData, key: string) => {
  const v = fd.get(key);
  return typeof v === "string" ? v.replace(/\r\n/g, "\n") : "";
};

export async function saveSitePage(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireSuperAdmin();
  const { t } = await getI18n();
  const slug = str(formData, "slug");
  const { error } = await supabase.rpc("admin_save_site_page", {
    p_slug: slug,
    p_title_en: str(formData, "title_en") ?? "",
    p_title_bn: str(formData, "title_bn") ?? "",
    p_body_en: text(formData, "body_en"),
    p_body_bn: text(formData, "body_bn"),
  });
  if (error) return { error: error.message.startsWith("Fill in") ? t("site.err.both") : error.message };
  revalidateTag(SITE_TAG, { expire: 0 });
  revalidateSite(`/${slug}`);
  revalidatePath("/admin/site");
  return { success: t("site.saved") };
}

export async function saveSiteInfo(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireSuperAdmin();
  const { t } = await getI18n();
  const email = str(formData, "contact_email");
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: t("contact.err.email") };
  const { error } = await supabase.rpc("admin_save_site_info", {
    p_email: email ?? "",
    p_phone: str(formData, "contact_phone") ?? "",
    p_whatsapp: str(formData, "whatsapp") ?? "",
    p_address_en: str(formData, "address_en") ?? "",
    p_address_bn: str(formData, "address_bn") ?? "",
    p_hours_en: str(formData, "office_hours_en") ?? "",
    p_hours_bn: str(formData, "office_hours_bn") ?? "",
  });
  if (error) return { error: error.message };
  revalidateTag(SITE_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  return { success: t("site.saved") };
}

export async function setContactStatus(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireSuperAdmin();
  const { t } = await getI18n();
  const { error } = await supabase.rpc("admin_set_contact_status", { p_id: str(formData, "id"), p_status: str(formData, "status") });
  if (error) return { error: error.message };
  revalidatePath("/admin", "layout");
  return { success: t("admin.actionDone") };
}

export async function setReviewStatus(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireSuperAdmin();
  const { t } = await getI18n();
  const { error } = await supabase.rpc("admin_set_review_status", { p_id: str(formData, "id"), p_status: str(formData, "status") });
  if (error) return { error: error.message };
  revalidateTag(REVIEWS_TAG, { expire: 0 });
  revalidatePath("/admin", "layout");
  revalidateSite("/");
  return { success: t("admin.actionDone") };
}

export async function deleteReview(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireSuperAdmin();
  const { t } = await getI18n();
  const { error } = await supabase.rpc("admin_delete_review", { p_id: str(formData, "id") });
  if (error) return { error: error.message };
  revalidateTag(REVIEWS_TAG, { expire: 0 });
  revalidatePath("/admin", "layout");
  revalidateSite("/");
  return { success: t("admin.actionDone") };
}

export async function saveHomeVideo(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireSuperAdmin();
  const { t } = await getI18n();
  const link = str(formData, "youtube") ?? "";
  const id = link ? youtubeId(link) : null;
  if (link && !id) return { error: t("video.err.link") };
  const { error } = await supabase.rpc("admin_save_home_video", {
    p_slug: str(formData, "slug"),
    p_label_en: str(formData, "label_en") ?? "",
    p_label_bn: str(formData, "label_bn") ?? "",
    p_title_en: str(formData, "title_en") ?? "",
    p_title_bn: str(formData, "title_bn") ?? "",
    p_youtube_id: id ?? "",
    p_active: formData.get("active") === "on",
  });
  if (error) return { error: error.code === "23514" ? t("video.err.text") : error.message };
  revalidateTag(SITE_TAG, { expire: 0 });
  revalidateSite("/");
  revalidatePath("/admin/site");
  return { success: t("video.saved") };
}
