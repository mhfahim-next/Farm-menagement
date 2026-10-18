"use server";

import { revalidatePath } from "next/cache";
import { requireFarm } from "@/lib/auth";
import { int, str } from "@/lib/form";
import { getI18n } from "@/lib/i18n/server";
import type { ActionState } from "@/lib/types";

export async function saveReview(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireFarm();
  const { t, locale } = await getI18n();
  const name = str(formData, "name");
  const body = str(formData, "body");
  const rating = int(formData, "rating");
  if (!name) return { error: t("review.err.name") };
  if (!rating || rating < 1 || rating > 5) return { error: t("review.err.rating") };
  if (!body || body.length < 10 || body.length > 600) return { error: t("review.err.body") };

  const { error } = await supabase.rpc("submit_review", {
    p_name: name,
    p_role: str(formData, "role"),
    p_rating: rating,
    p_body: body,
    p_lang: locale,
  });
  if (error) return { error: t("common.errorGeneric") };
  revalidatePath("/dashboard/review");
  revalidatePath("/admin/reviews");
  return { success: t("review.saved") };
}
