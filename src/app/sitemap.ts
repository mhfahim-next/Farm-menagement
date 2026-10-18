import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import { SITE_URL } from "@/lib/site";

// Rebuilt at most once an hour.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/signup`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/doctor/signup`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/changelog`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${SITE_URL}/community`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const { data } = await createPublicClient()
      .from("blog_posts")
      .select("slug, updated_at, published_at")
      .eq("published", true)
      .order("published_at", { ascending: false });
    for (const p of data ?? []) {
      pages.push({
        url: `${SITE_URL}/blog/${p.slug}`,
        lastModified: new Date(p.updated_at ?? p.published_at ?? now),
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
    const [{ data: cats }, { data: links }] = await Promise.all([
      createPublicClient().from("blog_categories").select("slug, blog_posts(published)"),
      createPublicClient().from("blog_post_tags").select("tag:blog_tags(slug)"),
    ]);
    for (const c of cats ?? []) {
      const live = ((c.blog_posts ?? []) as { published: boolean }[]).some((p) => p.published);
      if (live) pages.push({ url: `${SITE_URL}/blog/category/${c.slug}`, lastModified: now, changeFrequency: "weekly", priority: 0.6 });
    }
    // Only tags with 2+ published articles (smaller tag pages are noindex).
    const tagCounts = new Map<string, number>();
    for (const l of links ?? []) {
      const slug = (l.tag as { slug?: string } | null)?.slug;
      if (slug) tagCounts.set(slug, (tagCounts.get(slug) ?? 0) + 1);
    }
    for (const [slug, n] of tagCounts) {
      if (n >= 2) pages.push({ url: `${SITE_URL}/blog/tag/${slug}`, lastModified: now, changeFrequency: "weekly", priority: 0.4 });
    }
    // Community questions that have at least one answer (unanswered ones are noindex).
    const { data: qs } = await createPublicClient()
      .from("community_questions")
      .select("id, last_activity_at")
      .eq("status", "published")
      .gt("answer_count", 0)
      .order("last_activity_at", { ascending: false })
      .limit(5000);
    for (const q of qs ?? []) {
      pages.push({ url: `${SITE_URL}/community/q/${q.id}`, lastModified: new Date(q.last_activity_at), changeFrequency: "weekly", priority: 0.6 });
    }
  } catch {
    // The sitemap still lists the main pages if the database is unreachable.
  }
  // Each page also exists in Bangla at ?lang=bn.
  return pages.map((p) => ({ ...p, alternates: { languages: { en: p.url, bn: `${p.url}${p.url.includes("?") ? "&" : "?"}lang=bn` } } }));
}
