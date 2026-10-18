"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { PLANS_TAG } from "@/lib/public-data";
import { requireSuperAdmin } from "@/lib/auth";
import { int, num, str } from "@/lib/form";
import type { MessageKey } from "@/lib/i18n/core";
import { getI18n } from "@/lib/i18n/server";
import type { ActionState } from "@/lib/types";

const DB_RULES: Record<string, MessageKey> = {
  "A plan's code cannot be changed.": "admin.plans.err.code",
  "The Free plan is the default for new farms and cannot be hidden.": "admin.plans.err.free",
};

/** Blank = unlimited (null); otherwise a whole number. */
function limit(fd: FormData, key: string): number | null | undefined {
  const raw = str(fd, key);
  if (raw === null) return null;
  const n = int(fd, key);
  return n === null ? undefined : n;
}

function fields(fd: FormData) {
  const price = str(fd, "price_monthly") === null ? null : num(fd, "price_monthly");
  const caps = {
    max_cattle: limit(fd, "max_cattle"),
    max_flocks: limit(fd, "max_flocks"),
    max_members: limit(fd, "max_members"),
    max_farms: limit(fd, "max_farms"),
    max_ai_prompts: limit(fd, "max_ai_prompts"),
  };
  const bad =
    price === undefined ||
    (price !== null && price < 0) ||
    Object.values(caps).some((v) => v === undefined || (v !== null && v < 0)) ||
    (caps.max_members !== null && caps.max_members! < 1) ||
    (caps.max_farms !== null && caps.max_farms! < 1);
  if (bad) return null;
  return {
    name_en: str(fd, "name_en") ?? "",
    name_bn: str(fd, "name_bn"),
    price_monthly: price,
    ...(caps as Record<string, number | null>),
    can_export: fd.get("can_export") === "on",
    priority_support: fd.get("priority_support") === "on",
    active: fd.get("active") === "on",
    sort_order: int(fd, "sort_order") ?? 100,
  };
}

export async function savePlan(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireSuperAdmin();
  const { t } = await getI18n();
  const key = str(formData, "key");
  const values = fields(formData);
  if (!key) return { error: t("common.errorGeneric") };
  if (!values) return { error: t("admin.plans.err.numbers") };
  if (!values.name_en) return { error: t("options.err.label") };

  const { data, error } = await supabase.from("plans").update(values).eq("key", key).select("key");
  if (error) return { error: DB_RULES[error.message] ? t(DB_RULES[error.message]) : error.message };
  if (!data?.length) return { error: t("common.dbForbidden") };

  revalidateTag(PLANS_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  return { success: t("admin.plans.saved") };
}

export async function addPlan(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireSuperAdmin();
  const { t } = await getI18n();
  const key = str(formData, "key")?.toLowerCase();
  const values = fields(formData);
  if (!key || !/^[a-z][a-z0-9_]{1,29}$/.test(key)) return { error: t("admin.plans.err.key") };
  if (!values) return { error: t("admin.plans.err.numbers") };
  if (!values.name_en) return { error: t("options.err.label") };

  const { error } = await supabase.from("plans").insert({ key, ...values });
  if (error) {
    if (error.code === "23505") return { error: t("admin.plans.err.exists") };
    return { error: error.message };
  }

  revalidateTag(PLANS_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  return { success: t("admin.plans.added") };
}
