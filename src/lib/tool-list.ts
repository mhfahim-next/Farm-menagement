import type { MessageKey } from "@/lib/i18n/core";

/** The farm tools: one page each, public at /tools/<slug> and in the dashboard at /dashboard/tools/<slug>. */
export const TOOLS = [
  { slug: "cattle-weight", key: "weight", icon: "📏" },
  { slug: "feed-ration", key: "ration", icon: "🌾" },
  { slug: "poultry-feed", key: "poultry", icon: "🐔" },
  { slug: "calving-date", key: "preg", icon: "📅" },
  { slug: "qurbani-price", key: "qurbani", icon: "🐂" },
  { slug: "unit-converter", key: "units", icon: "⚖️" },
  { slug: "medicine-dose", key: "dose", icon: "💊" },
  { slug: "fodder-land", key: "fodder", icon: "🌱" },
  { slug: "milk-price", key: "milk", icon: "🥛" },
] as const;

export type ToolSlug = (typeof TOOLS)[number]["slug"];
export const toolBySlug = (slug: string) => TOOLS.find((t) => t.slug === slug) ?? null;
export const toolName = (key: string) => `tools.${key}.name` as MessageKey;
export const toolShort = (key: string) => `tools.${key}.short` as MessageKey;
