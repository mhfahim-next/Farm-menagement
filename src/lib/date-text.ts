// Dates typed as dd/mm/yyyy (safe in client and server code). Forms still
// send ISO dates (yyyy-mm-dd) to the server.

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

/** Bangla digits to ASCII. */
const ascii = (s: string) => s.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));

/** "2026-11-09" → "09/11/2026"; anything else → "". */
export function isoToDmy(iso: string | null | undefined) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? "");
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
}

/** "9/11/2026", "09-11-2026", "০৯/১১/২০২৬" or "09112026" → "2026-11-09"; null if not a real date. */
export function dmyToIso(text: string): string | null {
  const s = ascii(text.trim());
  let d: number, mo: number, y: number;
  const parts = /^(\d{1,2})[/.\-\s](\d{1,2})[/.\-\s](\d{4})$/.exec(s);
  if (parts) [d, mo, y] = [Number(parts[1]), Number(parts[2]), Number(parts[3])];
  else if (/^\d{8}$/.test(s)) [d, mo, y] = [Number(s.slice(0, 2)), Number(s.slice(2, 4)), Number(s.slice(4))];
  else return null;
  if (y < 1900 || y > 2200 || mo < 1 || mo > 12 || d < 1) return null;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCMonth() !== mo - 1) return null; // 31/02 and the like
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/**
 * Tidies text while typing: digits only (Bangla digits allowed), slashes
 * added after the day and the month, at most dd/mm/yyyy. Text with the
 * person's own separators is kept as typed.
 */
export function typingDmy(text: string, previous = "") {
  const s = ascii(text);
  if (/[/.\-\s]/.test(s.replace(/\/$/, "")) && !/^\d{2}\/\d{0,2}\/?\d{0,4}$/.test(s)) return s.slice(0, 10);
  // Deleting a slash deletes it, not the digit before it.
  if (s.length < previous.length && ascii(previous).startsWith(s)) return s;
  const digits = s.replace(/\D/g, "").slice(0, 8);
  let out = digits.slice(0, 2);
  if (digits.length >= 2) out += "/" + digits.slice(2, 4);
  if (digits.length >= 4) out += "/" + digits.slice(4);
  return out;
}
