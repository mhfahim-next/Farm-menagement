"use server";

import { revalidatePath } from "next/cache";
import { MANAGERS, requireRole } from "@/lib/auth";
import { loadFeedRule } from "@/lib/feed-data";
import { FEED_KEYS, FEED_PRESETS, FEED_SPEC, type FeedPreset, type FeedRule } from "@/lib/feed-plan";
import { getI18n } from "@/lib/i18n/server";
import type { ActionState } from "@/lib/types";

async function store(rule: FeedRule | null) {
  const ctx = await requireRole(MANAGERS);
  const { supabase, farm, user } = ctx;
  const { error } = rule
    ? await supabase.from("feed_settings").upsert({ farm_id: farm.id, rule, updated_at: new Date().toISOString(), updated_by: user.id })
    : await supabase.from("feed_settings").delete().eq("farm_id", farm.id);
  revalidatePath("/dashboard/feed");
  revalidatePath("/dashboard/cattle/[id]", "page");
  return error?.message ?? null;
}

/** Saves the farm's own feeding rule from the form (every number checked against its limits). */
export async function saveFeedRule(_: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const rule = {} as FeedRule;
  for (const k of FEED_KEYS) {
    const raw = formData.get(k);
    const v = Number(typeof raw === "string" ? raw.replace(",", ".") : NaN);
    const s = FEED_SPEC[k];
    if (!Number.isFinite(v) || v < s.min || v > s.max) return { error: t("feed.err.range", { field: t(`feed.f.${k}`), min: s.min, max: s.max }) };
    rule[k] = v;
  }
  if (rule.firstLitres > 0 !== rule.firstKg > 0) return { error: t("feed.err.first") };
  const error = await store(rule);
  return error ? { error } : { success: t("feed.saved") };
}

/** Starts from one of the source rules (keeps the farm's roughage, water and other settings). */
export async function applyFeedPreset(_: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const name = formData.get("preset") as FeedPreset;
  if (!(name in FEED_PRESETS)) return { error: t("feed.err.preset") };
  const ctx = await requireRole(MANAGERS);
  const { rule } = await loadFeedRule(ctx);
  const error = await store({ ...rule, ...FEED_PRESETS[name] });
  return error ? { error } : { success: t("feed.saved") };
}

/** Back to the FarmFlows default rule. */
export async function resetFeedRule(): Promise<ActionState> {
  const { t } = await getI18n();
  const error = await store(null);
  return error ? { error } : { success: t("feed.resetDone") };
}
