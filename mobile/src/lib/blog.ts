// The website's blog in the app: published articles only (public reads, row-level security).
import { SUPABASE_URL } from "./env";
import type { Locale } from "./i18n/core";
import { supabase } from "./supabase";

export const BLOG_IMAGE_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/blog-images/`;
export const blogImageUrl = (path: string) => BLOG_IMAGE_PREFIX + path;

type Bi = { en: string | null; bn: string | null };
export type BlogCategory = { id: string; slug: string; name_en: string; name_bn: string; sort_order: number };
export type BlogImage = { path: string; alt_en: string | null; alt_bn: string | null; width: number | null; height: number | null };
export type BlogCard = {
  id: string;
  slug: string;
  title_en: string | null;
  title_bn: string | null;
  summary_en: string | null;
  summary_bn: string | null;
  published_at: string | null;
  category: BlogCategory | null;
  cover: BlogImage | null;
};
export type BlogPost = BlogCard & { body_en: string | null; body_bn: string | null; tags: { tag: { id: string; slug: string; name_en: string; name_bn: string } }[] };

/** A bilingual field in the reader's language, else the other one. */
export const pick = (row: Record<string, unknown>, field: string, locale: Locale) => {
  const v = (row as Record<string, Bi[keyof Bi]>)[`${field}_${locale}`] || (row as Record<string, Bi[keyof Bi]>)[`${field}_${locale === "bn" ? "en" : "bn"}`];
  return (v ?? "") as string;
};

const CARD = "id, slug, title_en, title_bn, summary_en, summary_bn, published_at, category:blog_categories(*), cover:blog_images(path, alt_en, alt_bn, width, height)";

export async function fetchCategories() {
  const { data, error } = await supabase.from("blog_categories").select("*").order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []) as BlogCategory[];
}

export async function fetchPosts(categoryId: string | null, q: string) {
  let query = supabase.from("blog_posts").select(CARD).eq("published", true).order("published_at", { ascending: false }).limit(60);
  if (categoryId) query = query.eq("category_id", categoryId);
  const term = q.replace(/[%,()"\\*]/g, " ").trim().slice(0, 80);
  if (term) query = query.or(["title_en", "title_bn", "summary_en", "summary_bn", "body_en", "body_bn"].map((c) => `${c}.ilike.%${term}%`).join(","));
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as BlogCard[];
}

/** One article with its tags, and the sizes of the library images in it (so they don't jump while loading). */
export async function fetchPost(slug: string) {
  const { data, error } = await supabase
    .from("blog_posts")
    .select(`${CARD}, body_en, body_bn, tags:blog_post_tags(tag:blog_tags(*))`)
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const post = data as unknown as BlogPost | null;
  if (!post) return null;
  const paths = [...`${post.body_en ?? ""}\n${post.body_bn ?? ""}`.matchAll(/blog-images\/([a-z0-9-]+\.(?:jpg|png|webp))/g)].map((m) => m[1]);
  const { data: imgs } = paths.length ? await supabase.from("blog_images").select("path, width, height").in("path", [...new Set(paths)]) : { data: [] };
  const sizes = Object.fromEntries(((imgs ?? []) as BlogImage[]).filter((i) => i.width && i.height).map((i) => [i.path, { w: i.width!, h: i.height! }]));
  return { post, sizes };
}
