const TIMEZONE = process.env.APP_TIMEZONE ?? "Asia/Dhaka";

/** Today's date as YYYY-MM-DD in the farm's timezone. */
export function today(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).format(d);
}

export function monthStart() {
  return today().slice(0, 8) + "01";
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${formatNumber(amount)}`;
  }
}

export function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
  }).format(value);
}

/** Age in a short human form from a YYYY-MM-DD birth date. */
export function ageFrom(dateOfBirth: string | null) {
  if (!dateOfBirth) return "—";
  const months = Math.floor(
    (Date.parse(today()) - Date.parse(dateOfBirth)) / (30.44 * 86_400_000),
  );
  if (months < 1) return "< 1 mo";
  if (months < 24) return `${months} mo`;
  return `${Math.floor(months / 12)} yr ${months % 12} mo`;
}

export function label(value: string) {
  return value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}
