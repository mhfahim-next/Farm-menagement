/** Ranked list with an inline magnitude bar (one hue). Text stays in ink colours. */
export function BarList({ rows, empty }: { rows: { label: string; value: number; display: string }[]; empty: string }) {
  if (rows.length === 0) return <p className="py-6 text-center text-sm text-stone-500">{empty}</p>;
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="grid gap-1.5">
      {rows.map((r) => (
        <li key={r.label} className="relative overflow-hidden rounded-md">
          <span aria-hidden className="absolute inset-y-0 left-0 rounded-md bg-emerald-100" style={{ width: `${(r.value / max) * 100}%` }} />
          <span className="relative flex items-center justify-between gap-3 px-2.5 py-1.5 text-sm">
            <span className="min-w-0 truncate text-stone-800">{r.label}</span>
            <span className="shrink-0 font-semibold tabular-nums text-stone-900">{r.display}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
