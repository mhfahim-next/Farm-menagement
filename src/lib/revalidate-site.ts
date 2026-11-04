import "server-only";
import { revalidatePath } from "next/cache";
import { LOCALES } from "@/lib/i18n/core";

/**
 * Refreshes a public page in both languages. Public pages are served from
 * app/(site)/[lang] (the proxy rewrites /blog to /en/blog), so the cache knows
 * them as /en/… and /bn/…. With "layout", every page under the path.
 */
export function revalidateSite(path: string, type?: "layout") {
  const p = path === "/" ? "" : path;
  if (type === "layout") return revalidatePath(`/[lang]${p}`, "layout");
  for (const l of LOCALES) revalidatePath(`/${l}${p}`);
}
