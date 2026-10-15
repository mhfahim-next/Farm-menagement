import type { LimitState } from "@/lib/plan-utils";

/** A labelled usage bar (cattle 12 of 25). Unlimited resources show no bar. */
export function UsageMeter({
  label,
  used,
  max,
  state,
  text,
}: {
  label: string;
  used: number;
  max: number | null;
  state: LimitState;
  text: string;
}) {
  const pct = max === null ? 0 : Math.min(100, max === 0 ? 100 : (used / max) * 100);
  const color = state === "ok" ? "bg-emerald-600" : state === "warn" ? "bg-amber-500" : "bg-red-500";
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium text-stone-700">{label}</span>
        <span className="tabular-nums text-stone-500">{text}</span>
      </div>
      {max !== null && (
        <div className="h-2 overflow-hidden rounded-full bg-stone-100" role="progressbar" aria-valuenow={used} aria-valuemin={0} aria-valuemax={max} aria-label={label}>
          <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}
