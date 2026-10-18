"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { COMMUNITY_BUCKET, MAX_COMMUNITY_IMAGES, REPORT_REASONS } from "@/lib/community";
import { str } from "@/lib/form";
import type { I18n } from "@/lib/i18n/core";
import { getI18n } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";

const UUID = /^[0-9a-f-]{36}$/i;

/** Our own database messages, shown in the reader's language. */
function message(t: I18n["t"], error: { code?: string; message: string }) {
  const known: Record<string, Parameters<I18n["t"]>[0]> = {
    "Too many questions. Please wait a while.": "community.errTooManyQuestions",
    "Too many answers. Please wait a while.": "community.errTooManyAnswers",
    "You cannot post in the community.": "community.errBanned",
    "You cannot mark your own post.": "community.errOwnPost",
    "Sign in to post.": "community.signInToPost",
    "Sign in first.": "community.signInToPost",
  };
  const key = known[error.message];
  if (key) return t(key);
  if (error.code === "23514") return t("community.errLength");
  if (error.code === "P0002") return t("community.errNotFound");
  return t("common.errorGeneric");
}

/** Image paths from the form: only the member's own uploaded files. */
function images(formData: FormData, userId: string) {
  return formData
    .getAll("images")
    .filter((x): x is string => typeof x === "string" && x.startsWith(`${userId}/`) && /^[0-9a-f-]+\/[a-z0-9-]+\.webp$/.test(x))
    .slice(0, MAX_COMMUNITY_IMAGES);
}

function refresh(questionId?: string) {
  revalidatePath("/community");
  if (questionId) revalidatePath(`/community/q/${questionId}`);
  revalidatePath("/admin/community");
}

export async function askQuestion(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getUser();
  const { t } = await getI18n();
  if (!user) return { error: t("community.signInToPost") };
  const title = str(formData, "title") ?? "";
  const body = str(formData, "body") ?? "";
  if (title.length < 10) return { error: t("community.errTitleShort") };
  if (body.length < 10) return { error: t("community.errBodyShort") };
  const topic = str(formData, "topic_id");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("community_ask", {
    p_topic: topic && UUID.test(topic) ? topic : null,
    p_title: title,
    p_body: body,
    p_images: images(formData, user.id),
  });
  if (error) return { error: message(t, error) };
  refresh();
  redirect(`/community/q/${data as string}`);
}

export async function postAnswer(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getUser();
  const { t } = await getI18n();
  if (!user) return { error: t("community.signInToPost") };
  const questionId = str(formData, "question_id");
  const body = str(formData, "body") ?? "";
  if (!questionId || !UUID.test(questionId)) return { error: t("common.errorGeneric") };
  if (body.length < 2) return { error: t("community.errBodyShort") };

  const supabase = await createClient();
  const { error } = await supabase.rpc("community_answer", {
    p_question: questionId,
    p_body: body,
    p_images: images(formData, user.id),
  });
  if (error) return { error: message(t, error) };
  refresh(questionId);
  const { data: settings } = await supabase.from("system_settings").select("community_premoderation").eq("id", 1).maybeSingle();
  return { success: t(settings?.community_premoderation ? "community.answerPending" : "community.answerPosted") };
}

export async function editPost(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getUser();
  const { t } = await getI18n();
  if (!user) return { error: t("community.signInToPost") };
  const type = str(formData, "type");
  const id = str(formData, "id");
  const questionId = str(formData, "question_id");
  const body = str(formData, "body") ?? "";
  if ((type !== "question" && type !== "answer") || !id || !UUID.test(id)) return { error: t("common.errorGeneric") };
  if (body.length < (type === "question" ? 10 : 2)) return { error: t("community.errBodyShort") };
  const title = type === "question" ? str(formData, "title") : null;
  if (type === "question" && (title ?? "").length < 10) return { error: t("community.errTitleShort") };
  const topic = str(formData, "topic_id");

  const supabase = await createClient();
  const { error } = await supabase.rpc("community_edit", {
    p_type: type,
    p_id: id,
    p_body: body,
    p_title: title,
    p_topic: topic && UUID.test(topic) ? topic : null,
    p_images: null,
  });
  if (error) return { error: message(t, error) };
  refresh(questionId ?? undefined);
  return { success: t("community.saved") };
}

export async function deletePost(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getUser();
  const { t } = await getI18n();
  if (!user) return { error: t("community.signInToPost") };
  const type = str(formData, "type");
  const id = str(formData, "id");
  const questionId = str(formData, "question_id");
  if ((type !== "question" && type !== "answer") || !id || !UUID.test(id)) return { error: t("common.errorGeneric") };

  const supabase = await createClient();
  const { data: paths, error } = await supabase.rpc("community_delete", { p_type: type, p_id: id });
  if (error) return { error: message(t, error) };
  const files = ((paths ?? []) as string[]).filter(Boolean);
  if (files.length) await supabase.storage.from(COMMUNITY_BUCKET).remove(files);
  refresh(questionId ?? undefined);
  return { success: t("community.deleted") };
}

/** Toggles "helpful"; returns the new state for the button. */
export async function toggleHelpful(type: "question" | "answer", id: string, questionId: string) {
  const user = await getUser();
  const { t } = await getI18n();
  if (!user) return { error: t("community.signInToVote") };
  if (!UUID.test(id)) return { error: t("common.errorGeneric") };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("community_toggle_helpful", { p_type: type, p_id: id });
  if (error) return { error: message(t, error) };
  refresh(questionId);
  return { on: data as boolean };
}

export async function setBestAnswer(_: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const questionId = str(formData, "question_id");
  const answerId = str(formData, "answer_id");
  if (!questionId || !UUID.test(questionId) || (answerId && !UUID.test(answerId))) return { error: t("common.errorGeneric") };
  const supabase = await createClient();
  const { error } = await supabase.rpc("community_set_best_answer", { p_question: questionId, p_answer: answerId });
  if (error) return { error: message(t, error) };
  refresh(questionId);
  return { success: t(answerId ? "community.bestSet" : "community.bestCleared") };
}

export async function reportPost(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getUser();
  const { t } = await getI18n();
  if (!user) return { error: t("community.signInToReport") };
  const type = str(formData, "type");
  const id = str(formData, "id");
  const reason = str(formData, "reason");
  if ((type !== "question" && type !== "answer") || !id || !UUID.test(id)) return { error: t("common.errorGeneric") };
  if (!REPORT_REASONS.includes(reason as (typeof REPORT_REASONS)[number])) return { error: t("community.reportPickReason") };
  const supabase = await createClient();
  const { error } = await supabase.rpc("community_report", {
    p_type: type,
    p_id: id,
    p_reason: reason,
    p_note: str(formData, "note"),
  });
  if (error) return { error: message(t, error) };
  // No page refresh here: if this report hides the post, the reporter would lose the
  // confirmation along with it. The admin queue is rendered fresh on every visit.
  return { success: t("community.reported") };
}
