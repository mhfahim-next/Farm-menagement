"use server";

import { revalidatePath } from "next/cache";
import { AiError, pingProvider } from "@/lib/ai/assistant";
import { AI_PROVIDERS, getAiConfig, type AiProvider } from "@/lib/ai/config";
import { requireSuperAdmin } from "@/lib/auth";
import { str } from "@/lib/form";
import { getI18n } from "@/lib/i18n/server";
import type { ActionState } from "@/lib/types";

export async function saveAiSettings(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireSuperAdmin();
  const { t } = await getI18n();
  const provider = str(formData, "provider") as AiProvider | null;
  const model = str(formData, "model");
  const baseUrl = str(formData, "base_url");

  if (!provider || !AI_PROVIDERS.includes(provider)) return { error: t("common.errorGeneric") };
  if (model && !/^[A-Za-z0-9._:/-]{1,100}$/.test(model)) return { error: t("admin.ai.errModel") };
  if (provider === "custom") {
    if (!baseUrl || !/^https?:\/\/\S{3,255}$/.test(baseUrl)) return { error: t("admin.ai.errBaseUrl") };
    if (!model) return { error: t("admin.ai.errModelRequired") };
  }

  const { error } = await supabase.rpc("admin_set_ai_settings", { p_provider: provider, p_model: model ?? "", p_base_url: baseUrl ?? "" });
  if (error) return { error: error.message };
  revalidatePath("/admin", "layout");
  revalidatePath("/dashboard", "layout");
  return { success: t("admin.ai.saved") };
}

/** Sends one tiny prompt with the saved settings so the admin knows the key works. */
export async function testAiConnection(): Promise<ActionState> {
  const { supabase } = await requireSuperAdmin();
  const { t } = await getI18n();
  const cfg = await getAiConfig(supabase);
  if (!cfg.apiKey) return { error: t("admin.ai.testNoKey", { env: cfg.keyEnv }) };
  if (!cfg.model) return { error: t("admin.ai.errModelRequired") };
  try {
    const reply = await pingProvider(cfg);
    return { success: t("admin.ai.testOk", { provider: cfg.provider, model: cfg.model, reply: reply.slice(0, 60) || "—" }) };
  } catch (e) {
    const detail = e instanceof AiError ? e.message : e instanceof Error ? e.message : "";
    return { error: t("admin.ai.testFailed", { detail: detail.slice(0, 400) }) };
  }
}
