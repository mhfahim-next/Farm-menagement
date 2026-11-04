import type { Metadata } from "next";
import { getI18n } from "@/lib/i18n/server";
import { langAlternates } from "@/lib/site";
import { BlogIndex } from "../blog-index";

// Search results depend on the query, so they are made per request and kept
// out of search engines (thin duplicates of the list).
export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getI18n();
  return { title: `${t("blog.search")} · ${t("blog.metaTitle")}`, alternates: langAlternates("/blog", locale), robots: { index: false, follow: true } };
}

export default async function BlogSearchPage({ searchParams }: PageProps<"/[lang]/blog/search">) {
  const { q } = await searchParams;
  return <BlogIndex q={typeof q === "string" ? q.trim() : ""} />;
}
