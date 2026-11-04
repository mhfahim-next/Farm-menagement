import "server-only";
import { revalidatePath } from "next/cache";
import { LOCALES } from "@/lib/i18n/core";

/**
 * Pages under a section, as route files. revalidatePath(…, "layout") only
 * matches a folder that has a layout.tsx, and these sections have none, so
 * each page pattern is refreshed by name.
 */
const SECTIONS: Record<string, string[]> = {
  "/blog": ["/blog", "/blog/[slug]", "/blog/category/[slug]", "/blog/tag/[slug]", "/blog/search"],
  "/community": ["/community", "/community/topic/[slug]", "/community/q/[id]", "/community/list"],
  "/tools": ["/tools", "/tools/[slug]"],
};

/**
 * Refreshes a public page in both languages. Public pages are served from
 * app/(site)/[lang] (the proxy rewrites /blog to /en/blog), so the cache knows
 * them as /en/… and /bn/…. With "layout", every page of the section.
 */
export function revalidateSite(path: string, type?: "layout") {
  const p = path === "/" ? "" : path;
  if (type === "layout") {
    for (const page of SECTIONS[p] ?? [p]) revalidatePath(`/[lang]${page}`, "page");
    // /llms-full.txt holds the full text of every published article.
    if (p === "/blog") revalidatePath("/llms-full.txt");
    return;
  }
  for (const l of LOCALES) revalidatePath(`/${l}${p}`);
}
