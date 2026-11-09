"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth";
import { str } from "@/lib/form";
import { getI18n } from "@/lib/i18n/server";
import { PLACEMENTS, validPromoUrl } from "@/lib/promos";
import { PROMOS_TAG } from "@/lib/public-data";
import { revalidateSite } from "@/lib/revalidate-site";
import type { ActionState } from "@/lib/types";

/** Shows a change on the blog and community pages right away. */
function refresh() {
  revalidateTag(PROMOS_TAG, { expire: 0 });
  revalidateSite("/blog", "layout");
  revalidateSite("/community", "layout");
  revalidatePath("/admin/promos");
}

const date = (v: string | null) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

export async function savePromo(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireSuperAdmin();
  const { t } = await getI18n();
  const kind = str(formData, "kind") === "sponsor" ? "sponsor" : "house";
  const url = str(formData, "url") ?? "";
  if (!validPromoUrl(url)) return { error: t("promo.err.url") };
  if (kind === "sponsor" && !str(formData, "sponsor_name")) return { error: t("promo.err.sponsor") };
  const placements = formData.getAll("placements").filter((x): x is (typeof PLACEMENTS)[number] => PLACEMENTS.includes(x as never));
  if (!placements.length) return { error: t("promo.err.place") };
  const starts = date(str(formData, "starts_on"));
  const ends = date(str(formData, "ends_on"));
  if (starts && ends && ends < starts) return { error: t("promo.err.dates") };
  const { error } = await supabase.rpc("admin_save_promo", {
    p_id: str(formData, "id"),
    p_kind: kind,
    p_sponsor_name: kind === "sponsor" ? str(formData, "sponsor_name") : null,
    p_title_en: str(formData, "title_en") ?? "",
    p_title_bn: str(formData, "title_bn") ?? "",
    p_body_en: str(formData, "body_en") ?? "",
    p_body_bn: str(formData, "body_bn") ?? "",
    p_cta_en: str(formData, "cta_en") ?? "",
    p_cta_bn: str(formData, "cta_bn") ?? "",
    p_url: url,
    p_image_path: str(formData, "image_path") ?? "",
    p_placements: placements,
    p_categories: formData.getAll("categories").filter((x): x is string => typeof x === "string" && /^[a-z0-9-]+$/.test(x)),
    p_starts_on: starts,
    p_ends_on: ends,
    p_priority: Math.max(-100, Math.min(100, Number(str(formData, "priority")) || 0)),
    p_active: formData.get("active") === "on",
  });
  if (error) return { error: error.code === "23514" ? t("promo.err.check") : error.message };
  refresh();
  return { success: t("promo.saved") };
}

export async function setPromoActive(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireSuperAdmin();
  const { t } = await getI18n();
  const { error } = await supabase.rpc("admin_set_promo_active", { p_id: str(formData, "id"), p_active: str(formData, "active") === "1" });
  if (error) return { error: error.message };
  refresh();
  return { success: t("admin.actionDone") };
}

export async function deletePromo(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireSuperAdmin();
  const { t } = await getI18n();
  const { error } = await supabase.rpc("admin_delete_promo", { p_id: str(formData, "id") });
  if (error) return { error: error.message };
  refresh();
  return { success: t("admin.actionDone") };
}
