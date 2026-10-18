import type { Locale } from "@/lib/i18n/core";
import { SUPABASE_URL } from "@/lib/supabase/env";

export type BlogPost = {
  id: string;
  slug: string;
  title_en: string | null;
  title_bn: string | null;
  summary_en: string | null;
  summary_bn: string | null;
  body_en: string | null;
  body_bn: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  category_id?: string | null;
  cover_image_id?: string | null;
};

export type BlogImage = {
  id: string;
  path: string;
  alt_en: string | null;
  alt_bn: string | null;
  caption_en: string | null;
  caption_bn: string | null;
  width: number | null;
  height: number | null;
  size_bytes: number | null;
  created_at: string;
};

export type BlogCategory = {
  id: string;
  slug: string;
  name_en: string;
  name_bn: string;
  description_en: string | null;
  description_bn: string | null;
  sort_order: number;
};

export type BlogTag = { id: string; slug: string; name_en: string; name_bn: string };

/** A post with its category, cover image and tags, as the public pages need it. */
export type BlogPostFull = BlogPost & {
  category: BlogCategory | null;
  cover: BlogImage | null;
  tags: { tag: BlogTag }[];
};

/** Select string that loads a post with everything shown on cards and article pages. */
export const POST_SELECT = "*, category:blog_categories(*), cover:blog_images(*), tags:blog_post_tags(tag:blog_tags(*))";
/** Same, without the long bodies (list pages). */
export const POST_CARD_SELECT =
  "id, slug, title_en, title_bn, summary_en, summary_bn, body_en, body_bn, published, published_at, created_at, updated_at, category_id, cover_image_id, category:blog_categories(*), cover:blog_images(*), tags:blog_post_tags(tag:blog_tags(*))";

export const BLOG_BUCKET = "blog-images";
export const BLOG_IMAGE_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/${BLOG_BUCKET}/`;

export const imageUrl = (path: string) => BLOG_IMAGE_PREFIX + path;

/** Picks a bilingual name ("name", "alt", "caption"…) in the reader's language. */
export function pickLang<T extends Record<string, unknown>>(row: T, field: string, locale: Locale): string {
  const other = locale === "bn" ? "en" : "bn";
  return ((row[`${field}_${locale}`] as string | null) || (row[`${field}_${other}`] as string | null) || "") as string;
}

/** Roughly how many minutes the text takes to read (200 words a minute). */
export function readingMinutes(text: string) {
  const words = text.replace(/[#>*`|\-]/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Turns a file name someone typed into a safe, SEO-friendly path: "Cow Feed.JPG" → "cow-feed". */
export function imageBaseName(name: string) {
  return slugify(name.replace(/\.(jpe?g|png|webp|gif)$/i, "")).slice(0, 100) || "image";
}

/** Picks the reader's language, falling back to the other one when it is empty. */
export function localized(post: BlogPost, locale: Locale) {
  const other = locale === "bn" ? "en" : "bn";
  const pick = (field: "title" | "summary" | "body") =>
    post[`${field}_${locale}` as keyof BlogPost] || post[`${field}_${other}` as keyof BlogPost] || null;
  // Show title and body from the same language so they never mismatch.
  const useLocale = post[`title_${locale}`] && post[`body_${locale}`] ? locale : other;
  return {
    title: (post[`title_${useLocale}`] ?? pick("title")) as string,
    summary: (post[`summary_${useLocale}`] ?? pick("summary")) as string | null,
    body: (post[`body_${useLocale}`] ?? pick("body")) as string,
    lang: useLocale as Locale,
  };
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
