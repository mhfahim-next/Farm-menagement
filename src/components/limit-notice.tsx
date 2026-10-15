import Link from "next/link";
import type { I18n } from "@/lib/i18n/core";
import type { LimitState, UsageKey } from "@/lib/plan-utils";

/**
 * Heads-up about a plan limit: amber when you are near it, red when you've hit
 * it (or are over it after a downgrade). Shown above the add form it limits.
 */
export function LimitNotice({
  t,
  kind,
  state,
  used,
  max,
  plan,
  canUpgrade,
}: {
  t: I18n["t"];
  kind: UsageKey;
  state: LimitState;
  used: number;
  max: number | null;
  plan: string;
  canUpgrade: boolean;
}) {
  if (state === "ok" || max === null) return null;
  const warn = state === "warn";
  const text = t(`plan.${state === "warn" ? "warn" : state === "over" ? "over" : "full"}.${kind}` as "plan.warn.cattle", {
    used,
    max,
    plan,
  });

  return (
    <div
      role={warn ? "status" : "alert"}
      data-testid={`limit-${state}`}
      className={`mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
        warn ? "border-amber-200 bg-amber-50 text-amber-900" : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      <span>{text}</span>
      {canUpgrade && (
        <Link
          href="/dashboard/plan"
          className="shrink-0 rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-800"
        >
          {t("plan.upgradeNow")}
        </Link>
      )}
    </div>
  );
}
