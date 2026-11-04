// The farmers' community (questions and answers) in the app. Reads go straight
// to Supabase (published posts are public; row-level security as on the
// website); every write goes through the same community_* database functions.
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { SUPABASE_URL } from "./env";
import { uuid } from "./records";
import { supabase } from "./supabase";

export const COMMUNITY_BUCKET = "community-images";
export const MAX_COMMUNITY_IMAGES = 4;
export const PAGE_SIZE = 20;
export const communityImageUrl = (path: string) => `${SUPABASE_URL}/storage/v1/object/public/${COMMUNITY_BUCKET}/${path}`;

export type Topic = { id: string; slug: string; name_en: string; name_bn: string; sort_order: number };
export type Question = {
  id: string;
  author_id: string;
  topic_id: string | null;
  title: string;
  body: string;
  images: string[];
  status: "pending" | "published" | "hidden";
  best_answer_id: string | null;
  answer_count: number;
  helpful_count: number;
  last_activity_at: string;
  created_at: string;
};
export type Answer = { id: string; question_id: string; author_id: string; body: string; images: string[]; status: Question["status"]; helpful_count: number; created_at: string };
export type Author = { id: string; full_name: string; avatar_url: string | null; is_vet: boolean };
export type Sort = "latest" | "unanswered" | "top";
export const SORTS: Sort[] = ["latest", "unanswered", "top"];
export const REPORT_REASONS = ["spam", "wrong", "abusive", "other"] as const;

const QUESTION_COLUMNS = "id, author_id, topic_id, title, body, images, status, best_answer_id, answer_count, helpful_count, last_activity_at, created_at";

async function check<T>(q: PromiseLike<{ data: T | null; error: { message: string } | null }>) {
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data;
}

export const fetchTopics = async () => ((await check(supabase.from("community_topics").select("*").order("sort_order"))) ?? []) as Topic[];

export async function fetchAuthors(ids: string[]) {
  const unique = [...new Set(ids)];
  if (!unique.length) return {} as Record<string, Author>;
  const rows = ((await check(supabase.rpc("community_authors", { p_ids: unique }))) ?? []) as Author[];
  return Object.fromEntries(rows.map((a) => [a.id, a])) as Record<string, Author>;
}

/** Published questions, newest activity first (or unanswered / most helpful), `pages` pages of 20. */
export async function fetchQuestions(opts: { topicId?: string | null; q?: string; sort: Sort; pages: number }) {
  let query = supabase.from("community_questions").select(QUESTION_COLUMNS, { count: "exact" }).eq("status", "published");
  if (opts.topicId) query = query.eq("topic_id", opts.topicId);
  const term = (opts.q ?? "").replace(/[%,()"\\*]/g, " ").trim().slice(0, 80);
  if (term) query = query.or(`title.ilike.%${term}%,body.ilike.%${term}%`);
  if (opts.sort === "unanswered") query = query.eq("answer_count", 0).order("created_at", { ascending: false });
  else if (opts.sort === "top") query = query.order("helpful_count", { ascending: false }).order("answer_count", { ascending: false });
  else query = query.order("last_activity_at", { ascending: false });
  const { data, count, error } = await query.range(0, opts.pages * PAGE_SIZE - 1);
  if (error) throw new Error(error.message);
  const questions = (data ?? []) as Question[];
  return { questions, total: count ?? 0, authors: await fetchAuthors(questions.map((x) => x.author_id)) };
}

/** A question with its answers (authors also see their own posts waiting for a moderator), and what I marked helpful. */
export async function fetchQuestion(id: string, userId: string | undefined) {
  const question = (await check(supabase.from("community_questions").select("*").eq("id", id).maybeSingle())) as Question | null;
  if (!question) return null;
  const answers = ((await check(supabase.from("community_answers").select("*").eq("question_id", id).order("created_at"))) ?? []) as Answer[];
  const ids = [question.id, ...answers.map((a) => a.id)];
  const mine = userId ? (((await check(supabase.from("community_votes").select("target_id").eq("user_id", userId).in("target_id", ids))) ?? []) as { target_id: string }[]) : [];
  return { question, answers, authors: await fetchAuthors([question.author_id, ...answers.map((a) => a.author_id)]), helpful: mine.map((v) => v.target_id) };
}

/** Best answer first, then verified vets' answers, then the rest by time (as on the website). */
export function orderAnswers(answers: Answer[], bestId: string | null, authors: Record<string, Author>) {
  const rank = (a: Answer) => (a.id === bestId ? 0 : authors[a.author_id]?.is_vet ? 1 : 2);
  return [...answers].sort((x, y) => rank(x) - rank(y) || x.created_at.localeCompare(y.created_at));
}

/** A database error as one of the community's own messages (the keys exist in both languages). */
export function communityError(message: string) {
  if (/Too many questions/i.test(message)) return "community.errTooManyQuestions" as const;
  if (/Too many answers/i.test(message)) return "community.errTooManyAnswers" as const;
  if (/cannot post/i.test(message)) return "community.errBanned" as const;
  if (/own post/i.test(message)) return "community.errOwnPost" as const;
  if (/not found/i.test(message)) return "community.errNotFound" as const;
  if (/check constraint|violates/i.test(message)) return "community.errLength" as const;
  return null;
}

export const ask = async (topicId: string | null, title: string, body: string, images: string[]) =>
  (await check(supabase.rpc("community_ask", { p_topic: topicId, p_title: title, p_body: body, p_images: images }))) as string;
export const answer = async (questionId: string, body: string, images: string[]) =>
  (await check(supabase.rpc("community_answer", { p_question: questionId, p_body: body, p_images: images }))) as string;
export const toggleHelpful = async (type: "question" | "answer", id: string) => (await check(supabase.rpc("community_toggle_helpful", { p_type: type, p_id: id }))) as boolean;
export const setBest = (questionId: string, answerId: string | null) => check(supabase.rpc("community_set_best_answer", { p_question: questionId, p_answer: answerId }));
export const report = (type: "question" | "answer", id: string, reason: (typeof REPORT_REASONS)[number], note: string) =>
  check(supabase.rpc("community_report", { p_type: type, p_id: id, p_reason: reason, p_note: note || null }));
export async function removePost(type: "question" | "answer", id: string) {
  const paths = ((await check(supabase.rpc("community_delete", { p_type: type, p_id: id }))) ?? []) as string[];
  if (paths.length) await supabase.storage.from(COMMUNITY_BUCKET).remove(paths);
}

/** Pick a photo, make it small WebP (the bucket only takes WebP) and upload it to the member's own folder. Returns its path. */
export async function addCommunityPhoto(userId: string) {
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.9 });
  const uri = res.canceled ? null : res.assets[0]?.uri;
  if (!uri) return null;
  const small = await manipulateAsync(uri, [{ resize: { width: 1600 } }], { compress: 0.75, format: SaveFormat.WEBP });
  const body = await (await fetch(small.uri)).arrayBuffer();
  const path = `${userId}/${uuid()}.webp`;
  const { error } = await supabase.storage.from(COMMUNITY_BUCKET).upload(path, body, { contentType: "image/webp" });
  if (error) throw new Error(error.message);
  return path;
}
export const dropCommunityPhoto = (path: string) => supabase.storage.from(COMMUNITY_BUCKET).remove([path]);
