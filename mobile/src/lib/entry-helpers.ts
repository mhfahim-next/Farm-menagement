// Small rules behind the daily entry screens (pure, so they are easy to test).

/** Morning milking until 2 pm on the farm's clock, evening after. */
export function defaultSession(hour: number) {
  return hour < 14 ? "morning" : "evening";
}

/** The farm's hour of day (Bangladesh time, UTC+6). */
export function farmHour(at = new Date()) {
  return new Date(at.getTime() + 6 * 3600_000).getUTCHours();
}

/** The − / + buttons: half a litre at a time, never below zero. */
export function stepLitres(value: string, by: number) {
  const n = Number(value.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d))).replace(",", "."));
  const next = Math.max(0, Math.round(((Number.isFinite(n) ? n : 0) + by) * 2) / 2);
  return next === 0 ? "" : String(next);
}

/** "Same as yesterday": yesterday's litres for the cows that have nothing typed yet. */
export function fillFrom(previous: Record<string, string>, current: Record<string, string>, cowIds: string[]) {
  const out = { ...current };
  let filled = 0;
  for (const id of cowIds) {
    if ((out[id] ?? "").trim() === "" && (previous[id] ?? "").trim() !== "") {
      out[id] = previous[id];
      filled++;
    }
  }
  return { values: out, filled };
}

/** How many cows on the sheet have a number. */
export function filledCount(values: Record<string, string>, cowIds: string[]) {
  return cowIds.filter((id) => (values[id] ?? "").trim() !== "").length;
}

/** Today's work: which milkings and which flocks are already written. */
export function todayStatus(milkSessions: string[], loggedFlocks: string[], flockIds: string[], dairy: boolean) {
  const milk = dairy ? (["morning", "evening"] as const).map((s) => ({ session: s, done: milkSessions.includes(s) })) : [];
  const flocks = flockIds.map((id) => ({ id, done: loggedFlocks.includes(id) }));
  return { milk, flocks, milkPending: milk.some((m) => !m.done), flocksPending: flocks.some((f) => !f.done) };
}
