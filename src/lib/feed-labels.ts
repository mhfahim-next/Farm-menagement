// Words for the feed plan (shared by the feed page and the animal page).
import type { FeedPlan, FeedRule } from "@/lib/feed-plan";
import type { I18n } from "@/lib/i18n/core";

/** One line describing the concentrate rule, e.g. "0.5 kg per 100 kg body weight + 1 kg per 2.5 L of milk". */
export function ruleSummary(rule: FeedRule, { t, f }: Pick<I18n, "t" | "f">) {
  const parts: string[] = [];
  if (rule.maintPer100 > 0) parts.push(t("feed.sum.per100", { kg: f.number(rule.maintPer100, 2) }));
  if (rule.maintFixed > 0) parts.push(t("feed.sum.fixed", { kg: f.number(rule.maintFixed, 2) }));
  if (rule.firstLitres > 0) parts.push(t("feed.sum.first", { l: f.number(rule.firstLitres, 1), kg: f.number(rule.firstKg, 1) }));
  parts.push(t(rule.firstLitres > 0 ? "feed.sum.thenPer" : "feed.sum.per", { l: f.number(rule.litresPerKg, 1) }));
  return `${parts.join(" + ")} · ${t("feed.sum.max", { kg: f.number(rule.maxKg, 1) })}`;
}

export function kindLabel(p: FeedPlan, daysToCalving: number | null, { t, f }: Pick<I18n, "t" | "f">) {
  const base = t(`feed.kind.${p.kind}`);
  const milk = p.kind === "milking" ? ` · ${t("common.litersShort", { n: f.number(p.milkL, 1) })}` : "";
  const calve = p.closeUp && daysToCalving != null ? ` · ${t("feed.calvesIn", { n: f.number(daysToCalving) })}` : "";
  return base + milk + calve;
}

