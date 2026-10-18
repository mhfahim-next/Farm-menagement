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
  } catch {
    // The sitemap still lists the main pages if the database is unreachable.
  }
  return pages;
}
