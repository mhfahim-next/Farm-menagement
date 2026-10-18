import "server-only";
import { unstable_cache } from "next/cache";
import type { OptionRow } from "@/lib/options";
import { createPublicClient } from "@/lib/supabase/public";
import type { Plan } from "@/lib/plan-utils";

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
  ["dropdown-options-v1"],
  { tags: [OPTIONS_TAG], revalidate: 3600 },
);

export const getCachedPlans = unstable_cache(
  async (): Promise<Plan[]> => {
    const { data, error } = await createPublicClient().from("plans").select("*").order("sort_order");
    if (error) throw new Error(error.message);
    return (data ?? []) as Plan[];
  },
  ["plans-v1"],
  { tags: [PLANS_TAG], revalidate: 3600 },
);
