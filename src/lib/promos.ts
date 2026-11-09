// Promo boxes on the blog and community pages (FarmFlows' own promotions and
// sponsor banners). Pure helpers: no server or database code, so they can be
// unit tested.

export const PLACEMENTS = ["blog_mid", "blog_end", "community_list", "community_question"] as const;
export type Placement = (typeof PLACEMENTS)[number];

export type Promo = {
  id: string;
  kind: "house" | "sponsor";
  sponsor_name: string | null;
  title_en: string;
  title_bn: string;
  body_en: string | null;
  body_bn: string | null;
  cta_en: string;
  cta_bn: string;
  url: string;
  image_path: string | null;
  placements: Placement[];
  categories: string[];
  starts_on: string | null;
  ends_on: string | null;
  priority: number;
  active: boolean;
};

/** Columns the public pages read. */
export const PROMO_SELECT =
  "id, kind, sponsor_name, title_en, title_bn, body_en, body_bn, cta_en, cta_bn, url, image_path, placements, categories, starts_on, ends_on, priority, active";

/** A page of this site ("/signup") or a secure outside address. */
export function validPromoUrl(url: string) {
  return /^\/($|[^/\s][^\s]*$)/.test(url) || /^https:\/\/[^\s/]+\.[^\s]+$/.test(url);
}

/** Today in Bangladesh (the dates in admin are Bangladesh days). */
export function todayBd(now = new Date()) {
  return new Date(now.getTime() + 6 * 3600_000).toISOString().slice(0, 10);
}

/** Small stable hash, so each page keeps the same box among equals (and pages share them out). */
function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * The box for one place on one page, or null.
 * - only switched-on boxes inside their dates;
 * - blog boxes with categories only on articles of those categories;
 * - no sponsor boxes on animal-health articles (health advice stays free of paid products);
 * - never a box already shown on the page (exclude);
 * - highest priority wins; among equals the page key picks one, so different
 *   pages show different boxes.
 */
export function pickPromo(
  promos: Promo[],
  place: Placement,
  opts: { key: string; category?: string | null; health?: boolean; today?: string; exclude?: string[] },
): Promo | null {
  const today = opts.today ?? todayBd();
  const fit = promos.filter(
    (p) =>
      p.active &&
      !opts.exclude?.includes(p.id) &&
      p.placements.includes(place) &&
      (!p.starts_on || p.starts_on <= today) &&
      (!p.ends_on || p.ends_on >= today) &&
      (!place.startsWith("blog") || p.categories.length === 0 || (!!opts.category && p.categories.includes(opts.category))) &&
      !(opts.health && p.kind === "sponsor"),
  );
  if (!fit.length) return null;
  // A box made for this category beats a general one of the same priority.
  const score = (p: Promo) => p.priority * 2 + (p.categories.length > 0 && place.startsWith("blog") ? 1 : 0);
  const best = Math.max(...fit.map(score));
  const top = fit.filter((p) => score(p) === best).sort((a, b) => a.id.localeCompare(b.id));
  return top[hash(opts.key) % top.length];
}

/**
 * Splits an article body in two at the "## " heading nearest its middle, for
 * a box between the halves. Null when the article is too short or has no
 * such heading past the first part (the box then goes only at the end).
 */
export function splitArticle(body: string): [string, string] | null {
  const text = body.replace(/\r\n?/g, "\n");
  if (text.length < 2500) return null;
  const heads: number[] = [];
  let fence = false;
  let at = 0;
  for (const line of text.split("\n")) {
    if (line.startsWith("```")) fence = !fence;
    else if (!fence && /^## /.test(line)) heads.push(at);
    at += line.length + 1;
  }
  const mid = text.length / 2;
  const ok = heads.filter((h) => h > text.length * 0.25 && h < text.length * 0.8);
  if (!ok.length) return null;
  const cut = ok.reduce((a, b) => (Math.abs(b - mid) < Math.abs(a - mid) ? b : a));
  return [text.slice(0, cut).trimEnd(), text.slice(cut)];
}

/** Click address: counts the click, then sends the visitor on (in their language for site pages). */
export const promoHref = (p: Pick<Promo, "id">, locale: string) => `/api/promo/${p.id}${locale === "bn" ? "?l=bn" : ""}`;
