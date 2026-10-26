import "server-only";
import { cache } from "react";
import { requireFarm } from "@/lib/auth";
import { getCachedPlans } from "@/lib/public-data";
import { createClient } from "@/lib/supabase/server";
import {
  limitOf,
  limitState,
  USAGE_KEYS,
  type LimitState,
  type Plan,
  type Usage,
  type UsageKey,
} from "./plan-utils";

/** All plans, cheapest first. Readable by everyone (the home page uses it). */
export const getPlans = cache(async (): Promise<Plan[]> => {
  try {
    return await getCachedPlans();
  } catch {
    // fall back to a direct read
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from("plans").select("*").order("sort_order");
  if (error) {
    console.error("Could not load plans:", error.message);
    return [];
  }
  return (data ?? []) as Plan[];
});

/**
 * The current farm's plan, what it is using, and how close each limit is.
 * Cached per request, so the layout and pages share one set of queries.
 */
export const getPlanContext = cache(async () => {
  const { supabase, farm } = await requireFarm();
  const plans = await getPlans();
  const plan = plans.find((p) => p.key === farm.plan) ?? plans[0];

  const [cattle, goats, flocks, members] = await Promise.all([
    supabase.from("cattle").select("id", { count: "exact", head: true }).eq("farm_id", farm.id).eq("species", "cattle").eq("status", "active").is("deleted_at", null),
    supabase.from("cattle").select("id", { count: "exact", head: true }).eq("farm_id", farm.id).in("species", ["goat", "sheep"]).eq("status", "active").is("deleted_at", null),
    supabase.from("flocks").select("id", { count: "exact", head: true }).eq("farm_id", farm.id).eq("status", "active").is("deleted_at", null),
    supabase.from("farm_members").select("user_id", { count: "exact", head: true }).eq("farm_id", farm.id).neq("role", "vet"),
  ]);
  const usage: Usage = { cattle: cattle.count ?? 0, goats: goats.count ?? 0, flocks: flocks.count ?? 0, members: members.count ?? 0 };

  const limits = {} as Record<UsageKey, number | null>;
  const states = {} as Record<UsageKey, LimitState>;
  for (const key of USAGE_KEYS) {
    limits[key] = plan ? limitOf(plan, key) : null;
    states[key] = limitState(usage[key], limits[key]);
  }
  return { plans, plan, usage, limits, states };
});
