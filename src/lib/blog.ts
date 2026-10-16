import type { Locale } from "@/lib/i18n/core";

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
};

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
