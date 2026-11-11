import "server-only";
import { unstable_cache } from "next/cache";
import type { OptionRow } from "@/lib/options";
import { createPublicClient } from "@/lib/supabase/public";
import type { Plan } from "@/lib/plan-utils";
import { PROMO_SELECT, type Promo } from "@/lib/promos";

/**
 * Public, rarely-changing data shared by every visitor, cached across
 * requests (instead of one database round-trip per page). Super-admin edits
 * call revalidateTag(...) so changes still show up right away.
 */
export const OPTIONS_TAG = "dropdown-options";
export const PLANS_TAG = "plans";

export const getCachedOptionRows = unstable_cache(
  async (): Promise<OptionRow[]> => {
    const { data, error } = await createPublicClient()
      .from("dropdown_options")
      .select("list_key, value, label_en, label_bn, sort_order, active, can_hide, meta")
      .order("sort_order");
    if (error) throw new Error(error.message); // not cached; the caller falls back
    return (data ?? []) as OptionRow[];
  },
  ["dropdown-options-v2"],
  { tags: [OPTIONS_TAG], revalidate: 3600 },
);

export const getCachedPlans = unstable_cache(
  async (): Promise<Plan[]> => {
    const { data, error } = await createPublicClient().from("plans").select("*").order("sort_order");
    if (error) throw new Error(error.message);
    return (data ?? []) as Plan[];
  },
  ["plans-v2"],
  { tags: [PLANS_TAG], revalidate: 3600 },
);

export const SITE_TAG = "site-content";
export const REVIEWS_TAG = "reviews";

export type SitePage = {
  slug: "terms" | "privacy";
  title_en: string;
  title_bn: string;
  body_en: string;
  body_bn: string;
  updated_at: string;
};

export type SiteInfo = {
  contact_email: string | null;
  contact_phone: string | null;
  whatsapp: string | null;
  address_en: string | null;
  address_bn: string | null;
  office_hours_en: string | null;
  office_hours_bn: string | null;
};

export type PublicReview = {
  id: string;
  name: string;
  role: string | null;
  rating: number;
  body: string;
  lang: "bn" | "en";
  approved_at: string | null;
};

export const getSitePage = unstable_cache(
  async (slug: SitePage["slug"]): Promise<SitePage | null> => {
    const { data, error } = await createPublicClient().from("site_pages").select("*").eq("slug", slug).maybeSingle();
    if (error) throw new Error(error.message);
    return data as SitePage | null;
  },
  ["site-page-v1"],
  { tags: [SITE_TAG], revalidate: 3600 },
);

export const getSiteInfo = unstable_cache(
  async (): Promise<SiteInfo | null> => {
    const { data, error } = await createPublicClient().from("site_info").select("*").eq("id", 1).maybeSingle();
    if (error) throw new Error(error.message);
    return data as SiteInfo | null;
  },
  ["site-info-v1"],
  { tags: [SITE_TAG], revalidate: 3600 },
);

export const getApprovedReviews = unstable_cache(
  async (): Promise<PublicReview[]> => {
    const { data, error } = await createPublicClient()
      .from("reviews")
      .select("id, name, role, rating, body, lang, approved_at")
      .eq("status", "approved")
      .order("approved_at", { ascending: false })
      .limit(40);
    if (error) throw new Error(error.message);
    return (data ?? []) as PublicReview[];
  },
  ["reviews-v1"],
  { tags: [REVIEWS_TAG], revalidate: 3600 },
);

export const getPublicStats = unstable_cache(
  async (): Promise<{ farms: number; animals: number; birds: number; records: number }> => {
    const { data, error } = await createPublicClient().rpc("public_stats");
    if (error) throw new Error(error.message);
    return data as { farms: number; animals: number; birds: number; records: number };
  },
  ["public-stats-v1"],
  { revalidate: 3600 },
);

/** Never let a public section break the page: fall back when the database is unreachable. */
export async function safe<T>(load: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await load();
  } catch {
    return fallback;
  }
}

export const TOOLS_TAG = "tool-settings";

/** The admin's changes to the farm tools' numbers (usually none: the tools then use their defaults). */
export const getCachedToolRows = unstable_cache(
  async (): Promise<{ tool: string; params: unknown }[]> => {
    const { data, error } = await createPublicClient().from("tool_settings").select("tool, params");
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  ["tool-settings-v1"],
  { tags: [TOOLS_TAG], revalidate: 3600 },
);

export const PROMOS_TAG = "promos";

/** Switched-on promo boxes (the page picks one per place and checks the dates). */
const cachedPromos = unstable_cache(
  async (): Promise<Promo[]> => {
    const { data, error } = await createPublicClient().from("promos").select(PROMO_SELECT).eq("active", true);
    if (error) throw new Error(error.message);
    return (data ?? []) as Promo[];
  },
  ["promos-v1"],
  { tags: [PROMOS_TAG], revalidate: 3600 },
);

/** Boxes are extras: if they cannot be read, the page is shown without them. */
export async function getPromos(): Promise<Promo[]> {
  try {
    return await cachedPromos();
  } catch (e) {
    console.warn(`promos: ${(e as Error).message}`);
    return [];
  }
}

export type HomeVideo = {
  slug: string;
  label_en: string;
  label_bn: string;
  title_en: string;
  title_bn: string;
  youtube_id: string;
  sort_order: number;
};

/** The home page's demo videos that have a YouTube link and are switched on. */
export const getHomeVideos = unstable_cache(
  async (): Promise<HomeVideo[]> => {
    const { data, error } = await createPublicClient()
      .from("home_videos")
      .select("slug, label_en, label_bn, title_en, title_bn, youtube_id, sort_order")
      .eq("active", true)
      .not("youtube_id", "is", null)
      .order("sort_order");
    if (error) throw new Error(error.message);
    return (data ?? []) as HomeVideo[];
  },
  ["home-videos-v1"],
  { tags: [SITE_TAG], revalidate: 3600 },
);
