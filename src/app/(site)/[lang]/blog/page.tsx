import type { Metadata } from "next";
import { getI18n } from "@/lib/i18n/server";
import { langAlternates } from "@/lib/site";
import { BlogIndex } from "./blog-index";

// Static, rebuilt at most once an hour and whenever an admin changes an article.
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getI18n();
  return { title: t("blog.metaTitle"), description: t("blog.desc"), alternates: langAlternates("/blog", locale) };
}

export default function BlogIndexPage() {
  return <BlogIndex q="" />;
}
