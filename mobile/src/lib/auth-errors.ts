// Sign-in helpers with no device code, so they can be unit-tested.
import type { MessageKey } from "./i18n/en";

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

/** A Supabase auth error in the reader's words. */
export function authErrorKey(e: { message?: string; code?: string; name?: string } | null | undefined): MessageKey {
  const msg = `${e?.code ?? ""} ${e?.message ?? ""}`.toLowerCase();
  if (msg.includes("invalid login") || msg.includes("invalid_credentials")) return "auth.err.invalid";
  if (msg.includes("not confirmed") || msg.includes("email_not_confirmed")) return "auth.err.notConfirmed";
  if (msg.includes("already registered") || msg.includes("user_already_exists")) return "auth.err.taken";
  if (msg.includes("weak") || msg.includes("password should")) return "auth.err.weak";
  if (msg.includes("fetch") || msg.includes("network") || e?.name === "AuthRetryableFetchError") return "common.network";
  return "common.error";
}

/** The raw error text, for causes `authErrorKey` doesn't explain (helps support find the problem). */
export function errorDetail(e: { message?: string; code?: string; status?: number } | null | undefined): string | null {
  if (!e || authErrorKey(e) !== "common.error") return null;
  const parts = [e.status ? String(e.status) : "", e.code ?? "", e.message ?? ""].filter(Boolean);
  return parts.length ? parts.join(" · ").slice(0, 200) : null;
}
