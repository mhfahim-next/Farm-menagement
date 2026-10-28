"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth";
import { str } from "@/lib/form";
import { getI18n } from "@/lib/i18n/server";
import { TOOLS_TAG } from "@/lib/public-data";
import { fieldLabel, parseField, specFor } from "@/lib/tool-admin";
import { checkParam, groupProblem, MIX_INGREDIENTS, TOOL_DEFAULTS, TOOL_PARAM_GROUPS, type ToolParamGroup } from "@/lib/tools";
import type { ActionState } from "@/lib/types";

function refresh() {
  revalidateTag(TOOLS_TAG, { expire: 0 });
  revalidatePath("/tools", "layout");
  revalidatePath("/dashboard/tools", "layout");
  revalidatePath("/admin/tools");
}

const groupOf = (fd: FormData) => {
  const g = str(fd, "group");
  return g && (TOOL_PARAM_GROUPS as string[]).includes(g) ? (g as ToolParamGroup) : null;
};

/** Save one group: only the values that differ from the defaults are stored; none left removes the row. */
export async function saveToolParams(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireSuperAdmin();
  const { t, f } = await getI18n();
  const group = groupOf(formData);
  if (!group) return { error: t("tadm.err.group") };

  const changed: Record<string, number | number[]> = {};
  const merged: Record<string, number | number[]> = { ...(TOOL_DEFAULTS[group] as Record<string, number | number[]>) };
  for (const [key, spec] of Object.entries(specFor(group))) {
    const raw = formData.get(key);
    const typed = parseField(spec, typeof raw === "string" ? raw : "");
    if (typed === null) continue;
    const value = checkParam(spec, typed);
    if (value === null) {
      const field = fieldLabel(t, group, key);
      return {
        error:
          typeof spec.def === "number"
            ? t("tadm.err.range", { field, min: f.number(spec.min), max: f.number(spec.max) })
            : t("tadm.err.list", { field, max: f.number(spec.maxLen ?? 30), min: f.number(spec.min), maxValue: f.number(spec.max) }),
      };
    }
    merged[key] = value;
    const def = spec.def;
    const same = typeof def === "number" ? value === def : Array.isArray(value) && value.length === def.length && value.every((n, i) => n === def[i]);
    if (!same) changed[key] = value;
  }

  const problem = groupProblem(group, merged);
  if (problem === "mixTotal") {
    const total = MIX_INGREDIENTS.reduce((s, i) => s + (merged[i] as number), 0);
    return { error: t("tadm.err.mixTotal", { total: f.number(total, 1) }) };
  }
  if (problem === "lowHigh") return { error: t("tadm.err.lowHigh") };

  const { error } = await supabase.rpc("admin_save_tool_params", { p_tool: group, p_params: changed });
  if (error) return { error: error.message };
  refresh();
  return { success: Object.keys(changed).length ? t("tadm.saved") : t("tadm.nothing") };
}

export async function resetToolParams(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireSuperAdmin();
  const { t } = await getI18n();
  const group = groupOf(formData);
  if (!group) return { error: t("tadm.err.group") };
  const { error } = await supabase.rpc("admin_save_tool_params", { p_tool: group, p_params: {} });
  if (error) return { error: error.message };
  refresh();
  return { success: t("tadm.wasReset") };
}

export async function resetAllToolParams(): Promise<ActionState> {
  const { supabase } = await requireSuperAdmin();
  const { t } = await getI18n();
  const { error } = await supabase.rpc("admin_reset_tool_params");
  if (error) return { error: error.message };
  refresh();
  return { success: t("tadm.wasReset") };
}
