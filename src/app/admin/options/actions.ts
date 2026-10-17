"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth";
import { int, str } from "@/lib/form";
import type { MessageKey } from "@/lib/i18n/core";
import { getI18n } from "@/lib/i18n/server";
import { isListKey, type ListKey, type OptionMeta } from "@/lib/options";
import type { ActionState } from "@/lib/types";

// Messages raised by validate_dropdown_option(), translated.
const DB_RULES: Record<string, MessageKey> = {
  "New options cannot be added to this list.": "options.err.cannotAdd",
  "An option's code cannot be changed.": "options.err.code",
  "This option is required by the app and cannot be hidden.": "options.err.required",
  "At least one option must stay visible.": "options.err.lastVisible",
  "Choose female or male for this animal type.": "options.err.sex",
  "Choose income or expense for this category.": "options.err.txnType",
  "Choose a valid health record type.": "options.err.recordType",
  "Enter the product name.": "options.err.product",
  "Repeat interval must be a whole number of days.": "options.err.interval",
  "Currency code must be 3 capital letters, e.g. BDT.": "options.err.currency",
};

/** Reads the per-list extra settings from the form. */
function metaFrom(list: ListKey, fd: FormData): OptionMeta | undefined {
  if (list === "cattle_category") {
    return { sex: str(fd, "meta_sex") === "male" ? "male" : "female", milking: fd.get("meta_milking") === "on" };
  }
  if (list === "finance_category") {
    return { txn_type: str(fd, "meta_txn_type") === "income" ? "income" : "expense" };
  }
  if (list === "health_preset" || list === "flock_health_preset") {
    return {
      record_type: str(fd, "meta_record_type") ?? "",
      product: str(fd, "meta_product") ?? "",
      interval_days: Math.max(0, int(fd, "meta_interval_days") ?? 0),
    };
  }
  return undefined;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 50);
}

export async function saveOption(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireSuperAdmin();
  const { t } = await getI18n();
  const list = str(formData, "list_key");
  const value = str(formData, "value");
  const labelEn = str(formData, "label_en");
  if (!isListKey(list) || !value) return { error: t("common.errorGeneric") };
  if (!labelEn) return { error: t("options.err.label") };

  const meta = metaFrom(list, formData);
  const { data, error } = await supabase
    .from("dropdown_options")
    .update({
      label_en: labelEn,
      label_bn: str(formData, "label_bn"),
      sort_order: int(formData, "sort_order") ?? 0,
      active: formData.get("active") === "on",
      ...(meta ? { meta } : {}),
    })
    .eq("list_key", list)
    .eq("value", value)
    .select("value");
  if (error) return { error: DB_RULES[error.message] ? t(DB_RULES[error.message]) : error.message };
  if (!data?.length) return { error: t("common.dbForbidden") };

  revalidatePath("/", "layout");
  return { success: t("options.saved") };
}

export async function addOption(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireSuperAdmin();
  const { t } = await getI18n();
  const list = str(formData, "list_key");
  const labelEn = str(formData, "label_en");
  if (!isListKey(list)) return { error: t("common.errorGeneric") };
  if (!labelEn) return { error: t("options.err.label") };

  const typed = str(formData, "value");
  const value = list === "currency" ? (typed ?? "").toUpperCase() : slugify(typed ?? labelEn);
  if (!value) return { error: t("options.err.label") };

  const meta = metaFrom(list, formData);
  const { error } = await supabase.from("dropdown_options").insert({
    list_key: list,
    value,
    label_en: labelEn,
    label_bn: str(formData, "label_bn"),
    sort_order: int(formData, "sort_order") ?? 999,
    ...(meta ? { meta } : {}),
  });
  if (error) {
    if (error.code === "23505") return { error: t("options.err.duplicate") };
    return { error: DB_RULES[error.message] ? t(DB_RULES[error.message]) : error.message };
  }

  revalidatePath("/", "layout");
  return { success: t("options.added") };
}
