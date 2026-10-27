// When the phone should remind: worked out here without device code (unit-tested).
// The morning note carries today's list as last seen; on later mornings, until
// the app is opened again, a short nudge. The evening note only when today's
// milk or eggs are still missing.

export type PlannedNote = { id: string; at: Date; title: string; body: string; url: string };

export const MORNING_HOUR = 7;
export const EVENING_HOUR = 20;
/** Mornings covered ahead, in case the app isn't opened for a while. */
export const DAYS_AHEAD = 7;

function at(base: Date, dayOffset: number, hour: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, 0, 0, 0);
  return d;
}

export function planNotes(
  now: Date,
  texts: { morning: { title: string; body: string } | null; nudge: { title: string; body: string }; evening: { title: string; body: string } | null },
): PlannedNote[] {
  const out: PlannedNote[] = [];
  const firstMorning = now < at(now, 0, MORNING_HOUR) ? 0 : 1;
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const day = firstMorning + i;
    const text = i === 0 && texts.morning ? texts.morning : texts.nudge;
    out.push({ id: `morning-${day}`, at: at(now, day, MORNING_HOUR), ...text, url: "/reminders" });
  }
  if (texts.evening && now < at(now, 0, EVENING_HOUR)) out.push({ id: "evening", at: at(now, 0, EVENING_HOUR), ...texts.evening, url: "/entry" });
  return out;
}

/** "3 things today: FMD vaccine due for #C-1, …" — the first few titles. */
export function morningBody(titles: string[], max = 3) {
  const shown = titles.slice(0, max).join(" · ");
  return titles.length > max ? `${shown} · +${titles.length - max}` : shown;
}
