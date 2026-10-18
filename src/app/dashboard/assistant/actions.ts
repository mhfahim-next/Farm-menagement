"use server";

import { getProfile, requireRole, STAFF } from "@/lib/auth";
import { AiError, runAssistant } from "@/lib/ai/assistant";
import { getAiConfig } from "@/lib/ai/config";
import { PROPOSAL_KINDS, type AskResult, type ChatTurn, type ProposalKind } from "@/lib/ai/types";
import { getI18n } from "@/lib/i18n/server";
import type { ActionState } from "@/lib/types";
import { logBreedingEvent } from "../breeding/actions";
import { addCattle, addWeight } from "../cattle/actions";
import { addTransaction } from "../finance/actions";
import { saveDailyLog } from "../flocks/actions";
import { recordHealth } from "../health/actions";
import { saveMilkSession } from "../milk/actions";

type Status = { used: number; max: number | null };

async function statusOf(supabase: Awaited<ReturnType<typeof requireRole>>["supabase"], farmId: string): Promise<Status> {
  const { data } = await supabase.rpc("ai_prompts_status", { p_farm: farmId });
  const s = data as { used?: number; max?: number | null } | null;
  return { used: s?.used ?? 0, max: s?.max ?? null };
}

/** One user message to the assistant. Counts as one prompt of the farm's monthly allowance. */
export async function askAssistant(history: ChatTurn[], text: string): Promise<AskResult> {
  const ctx = await requireRole(STAFF);
  const { supabase, farm } = ctx;
  const i18n = await getI18n();
  const { t } = i18n;

  const message = typeof text === "string" ? text.trim() : "";
  if (!message) return { error: t("ai.err.empty") };
  const cfg = await getAiConfig(supabase);
  if (!cfg.apiKey || !cfg.model) return { error: t("ai.err.notConfigured") };

  const safeHistory: ChatTurn[] = Array.isArray(history)
    ? history
        .filter((h): h is ChatTurn => !!h && (h.role === "user" || h.role === "assistant") && typeof h.text === "string")
        .slice(-12)
    : [];

  // Reserve a prompt first (race-safe, enforced by the database).
  const { data: usageId, error: limitError } = await supabase.rpc("ai_use_prompt", { p_farm: farm.id });
  if (limitError) {
    if (limitError.message.startsWith("PLAN_LIMIT:ai")) {
      return { error: t("ai.err.limit"), limitReached: true, status: await statusOf(supabase, farm.id) };
    }
    return { error: t("common.errorGeneric") };
  }

  try {
    const out = await runAssistant({ supabase, farm, i18n }, cfg, safeHistory, message);
    await supabase.rpc("ai_record_usage", { p_id: usageId as string, p_model: `${cfg.provider}:${cfg.model}`, p_in: out.inputTokens, p_out: out.outputTokens });
    return {
      reply: out.reply || (out.proposals.length ? t("ai.defaultReply") : t("ai.err.noReply")),
      proposals: out.proposals,
      status: await statusOf(supabase, farm.id),
    };
  } catch (e) {
    // The service failed: give the prompt back.
    await supabase.rpc("ai_cancel_prompt", { p_id: usageId as string });
    console.error("AI assistant failed:", e instanceof AiError ? `${e.kind}: ${e.message}` : e);
    const kind = e instanceof AiError ? e.kind : "failed";
    let message = t(kind === "busy" ? "ai.err.busy" : kind === "auth" ? "ai.err.badKey" : "ai.err.failed");
    // Super admins also see what the AI service said, to debug the setup.
    if (e instanceof AiError && (await getProfile())?.is_super_admin) {
      let detail = e.message;
      const m = /"message"\s*:\s*"((?:[^"\\]|\\.)*)"/.exec(detail)?.[1];
      if (m) detail = `${/^\d{3}/.exec(detail)?.[0] ?? ""} ${m}`.trim();
      message += ` [${cfg.provider}:${cfg.model}] ${detail.slice(0, 300)}`;
    }
    return { error: message, status: await statusOf(supabase, farm.id) };
  }
}

const RUNNERS: Record<ProposalKind, (s: ActionState, fd: FormData) => Promise<ActionState>> = {
  milk: saveMilkSession,
  health: recordHealth,
  breeding: logBreedingEvent,
  animal: addCattle,
  flock_log: saveDailyLog,
  transaction: addTransaction,
  weight: addWeight,
};

/** Saves a proposal the farmer confirmed, through the same server action the normal form uses. */
export async function confirmProposal(kind: string, fields: [string, string][]): Promise<ActionState> {
  const { t } = await getI18n();
  if (!PROPOSAL_KINDS.includes(kind as ProposalKind) || !Array.isArray(fields) || fields.length > 200) {
    return { error: t("common.errorGeneric") };
  }
  const fd = new FormData();
  for (const pair of fields) {
    if (!Array.isArray(pair) || typeof pair[0] !== "string" || typeof pair[1] !== "string" || pair[1].length > 2000) {
      return { error: t("common.errorGeneric") };
    }
    fd.append(pair[0], pair[1]);
  }
  return RUNNERS[kind as ProposalKind](null, fd);
}
