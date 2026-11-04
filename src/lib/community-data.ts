import "server-only";
import { cache } from "react";
import type { CommunityAnswer, CommunityAuthor, CommunityQuestion, CommunityTopic, Sort } from "@/lib/community";
import { createPublicClient } from "@/lib/supabase/public";

export const PAGE_SIZE = 20;

export const getTopics = cache(async () => {
  const { data } = await createPublicClient().from("community_topics").select("*").order("sort_order");
  return (data ?? []) as CommunityTopic[];
});

/** Name, photo and vet badge for the given authors. */
export async function getAuthors(ids: string[]) {
  const unique = [...new Set(ids)];
  if (!unique.length) return new Map<string, CommunityAuthor>();
  const { data } = await createPublicClient().rpc("community_authors", { p_ids: unique });
  return new Map(((data ?? []) as CommunityAuthor[]).map((a) => [a.id, a]));
}

const QUESTION_LIST =
  "id, author_id, topic_id, title, body, images, status, best_answer_id, answer_count, helpful_count, report_count, last_activity_at, created_at, updated_at";

/** Published questions for the list page (anonymous read, so it never depends on who is looking). */
export async function listQuestions(opts: { topicId?: string; q?: string; sort: Sort; page: number }) {
  let query = createPublicClient()
    .from("community_questions")
    .select(QUESTION_LIST, { count: "exact" })
    .eq("status", "published");
  if (opts.topicId) query = query.eq("topic_id", opts.topicId);
  if (opts.q) {
    const term = opts.q.replace(/[%,()"\\*]/g, " ").trim().slice(0, 80);
    if (term) query = query.or(`title.ilike.%${term}%,body.ilike.%${term}%`);
  }
  if (opts.sort === "unanswered") query = query.eq("answer_count", 0).order("created_at", { ascending: false });
  else if (opts.sort === "top") query = query.order("helpful_count", { ascending: false }).order("answer_count", { ascending: false });
  else query = query.order("last_activity_at", { ascending: false });
  const from = (opts.page - 1) * PAGE_SIZE;
  const { data, count } = await query.range(from, from + PAGE_SIZE - 1);
  return { questions: (data ?? []) as CommunityQuestion[], total: count ?? 0 };
}

/**
 * A published question with its published answers, read without cookies so
 * the question page can be cached for everyone (RLS hides everything else).
 * Throws when the database can't be read, so a failure is never cached as
 * "not found".
 */
export async function getQuestion(id: string) {
  const supabase = createPublicClient();
  const { data: question, error } = await supabase.from("community_questions").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`question ${id}: ${error.message}`);
  if (!question) return null;
  const { data: answers, error: e2 } = await supabase
    .from("community_answers")
    .select("*")
    .eq("question_id", id)
    .order("created_at", { ascending: true });
  if (e2) throw new Error(`answers ${id}: ${e2.message}`);
  return { question: question as CommunityQuestion, answers: (answers ?? []) as CommunityAnswer[] };
}
