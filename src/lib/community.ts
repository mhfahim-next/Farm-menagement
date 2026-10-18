import { SUPABASE_URL } from "@/lib/supabase/env";

export const COMMUNITY_BUCKET = "community-images";
export const COMMUNITY_IMAGE_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/${COMMUNITY_BUCKET}/`;
export const communityImageUrl = (path: string) => COMMUNITY_IMAGE_PREFIX + path;
export const MAX_COMMUNITY_IMAGES = 4;

export type CommunityTopic = { id: string; slug: string; name_en: string; name_bn: string; sort_order: number };

export type PostStatus = "pending" | "published" | "hidden";

export type CommunityQuestion = {
  id: string;
  author_id: string;
  topic_id: string | null;
  title: string;
  body: string;
  images: string[];
  status: PostStatus;
  best_answer_id: string | null;
  answer_count: number;
  helpful_count: number;
  report_count: number;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
};

export type CommunityAnswer = {
  id: string;
  question_id: string;
  author_id: string;
  body: string;
  images: string[];
  status: PostStatus;
  helpful_count: number;
  report_count: number;
  created_at: string;
  updated_at: string;
};

export type CommunityAuthor = { id: string; full_name: string; avatar_url: string | null; is_vet: boolean };

export const SORTS = ["latest", "unanswered", "top"] as const;
export type Sort = (typeof SORTS)[number];

export const REPORT_REASONS = ["spam", "wrong", "abusive", "other"] as const;

/** First ~160 characters of a post, on one line (meta descriptions, cards). */
export function excerpt(text: string, n = 160) {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > n ? flat.slice(0, n - 1).trimEnd() + "…" : flat;
}

/** Guesses the language of a post so `lang` is right for screen readers and search engines. */
export function postLang(text: string) {
  return /[\u0980-\u09FF]/.test(text) ? "bn" : "en";
}
