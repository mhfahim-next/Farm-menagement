import type { MessageKey } from "./i18n/en";

/** The farm tools (same list and order as the website's Tools menu). */
export const TOOLS = [
  { slug: "cattle-weight", key: "weight", icon: "tape-measure" },
  { slug: "feed-ration", key: "ration", icon: "barley" },
  { slug: "poultry-feed", key: "poultry", icon: "egg-outline" },
  { slug: "calving-date", key: "preg", icon: "calendar-heart" },
  { slug: "qurbani-price", key: "qurbani", icon: "cow" },
  { slug: "unit-converter", key: "units", icon: "scale-balance" },
  { slug: "medicine-dose", key: "dose", icon: "pill" },
  { slug: "fodder-land", key: "fodder", icon: "sprout" },
  { slug: "milk-price", key: "milk", icon: "cup-water" },
] as const;

export type ToolSlug = (typeof TOOLS)[number]["slug"];
export const toolBySlug = (slug: string) => TOOLS.find((t) => t.slug === slug) ?? null;
export const toolName = (key: string) => `tools.${key}.name` as MessageKey;
export const toolShort = (key: string) => `tools.${key}.short` as MessageKey;
