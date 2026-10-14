// Locale-independent date helpers. For display formatting (dates, numbers,
// money) use the `f` formatters from getI18n() / useI18n().

const TIMEZONE = process.env.APP_TIMEZONE ?? "Asia/Dhaka";

/** Today's date as YYYY-MM-DD in the farm's timezone. */
export function today(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).format(d);
}

export function monthStart() {
  return today().slice(0, 8) + "01";
}

/** Age in whole months from a YYYY-MM-DD birth date (null when unknown). */
export function ageInMonths(dateOfBirth: string | null) {
  if (!dateOfBirth) return null;
  return Math.max(
    0,
    Math.floor((Date.parse(today()) - Date.parse(dateOfBirth)) / (30.44 * 86_400_000)),
  );
}
