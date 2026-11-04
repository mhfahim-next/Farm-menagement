import { modifiedAt, type BlogPost } from "@/lib/blog";
import { GUIDE } from "@/lib/seo-content";
import { createPublicClient } from "@/lib/supabase/public";

// /llms-full.txt: the full text of every published blog article and of the
// farm management software guide, as Markdown, for AI assistants. Rebuilt at
// most once an hour and whenever an admin changes an article (revalidateSite
// for "/blog" also refreshes this file). Drafts are never included: the
// cookie-free client only sees published posts (RLS), and the query also
// filters on published.
export const revalidate = 3600;

const SITE = "https://www.farmflows.app";

const day = (iso: string) => iso.slice(0, 10);

/** Article Markdown as plain reading text: no images, no HTML, tidy spacing. */
function clean(md: string) {
  return md
    .replace(/\r\n?/g, "\n")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // images
    .replace(/<[^>]+>/g, "") // stray HTML
    .replace(/^(#{1,5}) /gm, "#$1 ") // headings one level down: each article is a "##" section
    .replace(/\]\((\/[^)\s]*)\)/g, (_, path: string) => `](${SITE}${path})`) // site links in full
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function guide() {
  const g = (x: { en: string }) => x.en;
  const lines = [
    `## ${g(GUIDE.h1)}`,
    "",
    `URL: ${SITE}/farm-management-software`,
    "",
    g(GUIDE.intro),
    "",
    `### ${g(GUIDE.whatTitle)}`,
    "",
    g(GUIDE.whatBody),
    "",
    `### ${g(GUIDE.trackTitle)}`,
    "",
    ...GUIDE.track.map((x) => `- **${g(x.title)}**: ${g(x.body)}`),
    "",
    `### ${g(GUIDE.freeTitle)}`,
    "",
    g(GUIDE.freeBody),
    "",
    `### ${g(GUIDE.compareTitle)}`,
    "",
    `| ${GUIDE.compareHead.en.join(" | ")} |`,
    `| ${GUIDE.compareHead.en.map(() => "---").join(" | ")} |`,
    ...GUIDE.compareRows.map((row) => `| ${row.en.join(" | ")} |`),
    "",
    `### ${g(GUIDE.chooseTitle)}`,
    "",
    ...GUIDE.choose.map((x, i) => `${i + 1}. ${g(x)}`),
    "",
    `### ${g(GUIDE.startTitle)}`,
    "",
    ...GUIDE.start.map((x, i) => `${i + 1}. ${g(x)}`),
    "",
    `### ${g(GUIDE.faqTitle)}`,
    "",
    ...GUIDE.faq.flatMap((i) => [`**${g(i.q)}**`, "", g(i.a), ""]),
  ];
  return lines.join("\n").trim();
}

export async function GET() {
  const { data, error } = await createPublicClient()
    .from("blog_posts")
    .select("slug, title_en, body_en, published, published_at, created_at, updated_at, content_updated_at")
    .eq("published", true)
    .order("published_at", { ascending: false });
  // A failed read must not be cached as an empty file: the last good one stays.
  if (error) throw new Error(`llms-full.txt: ${error.message}`);

  const posts = ((data ?? []) as BlogPost[]).filter((p) => p.published && p.title_en && p.body_en);
  const articles = posts.map((p) =>
    [
      `## ${(p.title_en ?? "").trim()}`,
      "",
      `URL: ${SITE}/blog/${p.slug}`,
      `Published: ${day(p.published_at ?? p.created_at)}`,
      `Last updated: ${day(modifiedAt(p))}`,
      "",
      clean(p.body_en ?? ""),
    ].join("\n"),
  );

  const body = [
    "# FarmFlows",
    "",
    "> Free farm management app for dairy, cattle, goat and layer-poultry farms in Bangladesh. Records for milk, eggs, vaccines, breeding, feed stock, sales and profit. Works in Bangla and English, on phone or computer.",
    "",
    ...articles.flatMap((a) => [a, ""]),
    guide(),
    "",
  ].join("\n");

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
