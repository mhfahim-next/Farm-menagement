import "server-only";
import type { FarmContext } from "@/lib/auth";

export type AiProvider = "anthropic" | "gemini" | "custom";
export const AI_PROVIDERS: AiProvider[] = ["anthropic", "gemini", "custom"];

/** Used when the super admin leaves the model blank. */
export const DEFAULT_MODELS: Record<AiProvider, string> = {
  anthropic: "claude-haiku-5-5", // the cheapest current Claude model
  gemini: "gemini-2.5-flash", // has a free tier
  custom: "",
};

export const GEMINI_BASE_URL = process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta/openai";

/** Which environment variable holds the key for each provider. */
export const KEY_ENV: Record<AiProvider, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  gemini: "GEMINI_API_KEY",
  custom: "AI_API_KEY",
};

export type AiConfig = {
  provider: AiProvider;
  model: string;
  /** OpenAI-compatible base URL (gemini, custom). */
  baseUrl: string | null;
  apiKey: string | null;
  keyEnv: string;
};

export function keyPresent(provider: AiProvider) {
  return !!process.env[KEY_ENV[provider]];
}

type Settings = { ai_provider?: string | null; ai_model?: string | null; ai_base_url?: string | null } | null;

export function resolveConfig(settings: Settings): AiConfig {
  const provider = AI_PROVIDERS.includes(settings?.ai_provider as AiProvider) ? (settings!.ai_provider as AiProvider) : "anthropic";
  return {
    provider,
    model: settings?.ai_model || DEFAULT_MODELS[provider],
    baseUrl: provider === "gemini" ? GEMINI_BASE_URL : provider === "custom" ? (settings?.ai_base_url ?? null) : null,
    apiKey: process.env[KEY_ENV[provider]] || null,
    keyEnv: KEY_ENV[provider],
  };
}

/** The provider the super admin chose (readable by every signed-in user; holds no secrets). */
export async function getAiConfig(supabase: FarmContext["supabase"]): Promise<AiConfig> {
  const { data } = await supabase.from("system_settings").select("ai_provider, ai_model, ai_base_url").eq("id", 1).maybeSingle();
  return resolveConfig(data);
}
