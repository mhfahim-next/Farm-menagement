import "server-only";
import { POST_CARD_SELECT, type BlogCategory, type BlogPostFull, type BlogTag } from "@/lib/blog";
import { createPublicClient } from "@/lib/supabase/public";

// Public blog reads. Only published posts are visible to the cookie-free client (RLS).

export async function getBlogCategories() {
  const { data } = await createPublicClient().from("blog_categories").select("*").order("sort_order");
  return (data ?? []) as BlogCategory[];
}

export async function getPublishedPosts(filter: { categoryId?: string; tagId?: string; q?: string; limit?: number } = {}) {
  const supabase = createPublicClient();
  let ids: string[] | null = null;
  if (filter.tagId) {
    const { data } = await supabase.from("blog_post_tags").select("post_id").eq("tag_id", filter.tagId);
    ids = (data ?? []).map((r) => r.post_id as string);
    if (!ids.length) return [];
  }
  let query = supabase
    .from("blog_posts")
    .select(POST_CARD_SELECT)
    .eq("published", true)
    .order("published_at", { ascending: false });
  if (filter.categoryId) query = query.eq("category_id", filter.categoryId);
  if (ids) query = query.in("id", ids);
  if (filter.q) {
    const term = filter.q.replace(/[%,()"\\*]/g, " ").trim().slice(0, 80);
    if (term) {
      query = query.or(
        ["title_en", "title_bn", "summary_en", "summary_bn", "body_en", "body_bn"].map((c) => `${c}.ilike.%${term}%`).join(","),
      );
    }
  }
  if (filter.limit) query = query.limit(filter.limit);
  const { data } = await query;
  return (data ?? []) as unknown as BlogPostFull[];
}

export async function getTagBySlug(slug: string) {
  const { data } = await createPublicClient().from("blog_tags").select("*").eq("slug", slug).maybeSingle();
  return data as BlogTag | null;
}

export async function getCategoryBySlug(slug: string) {
  const { data } = await createPublicClient().from("blog_categories").select("*").eq("slug", slug).maybeSingle();
  return data as BlogCategory | null;
}

/** Up to 3 other articles: same category first, then ones sharing a tag, then the newest. */
export async function getRelatedPosts(post: BlogPostFull) {
  const all = await getPublishedPosts({ limit: 40 });
  const tagIds = new Set(post.tags.map((t) => t.tag.id));
  const score = (p: BlogPostFull) =>
    (post.category_id && p.category_id === post.category_id ? 3 : 0) + p.tags.filter((t) => tagIds.has(t.tag.id)).length;
  return all
    .filter((p) => p.id !== post.id)
    .map((p, i) => ({ p, s: score(p), i }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, 3)
    .map((x) => x.p);
}
