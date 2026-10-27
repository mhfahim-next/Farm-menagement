import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "./supabase";

export { authErrorKey, errorDetail, isEmail } from "./auth-errors";

WebBrowser.maybeCompleteAuthSession();

/**
 * "Continue with Google": Supabase sends the browser to Google, which comes back
 * to farmflows://auth/callback with a one-time code. Add that address to
 * Supabase → Authentication → URL Configuration → Redirect URLs.
 */
export type GoogleResult = { status: "ok" | "cancelled" | "error"; detail?: string };

export async function signInWithGoogle(): Promise<GoogleResult> {
  const redirectTo = makeRedirectUri({ scheme: "farmflows", path: "auth/callback" });
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, skipBrowserRedirect: true, queryParams: { prompt: "select_account" } },
  });
  if (error || !data.url) return { status: "error", detail: error?.message };
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success") return { status: "cancelled" };
  const back = new URL(result.url);
  // Supabase puts its own error in the address when it can't finish (for example a missing redirect URL).
  const code = back.searchParams.get("code");
  if (!code) return { status: "error", detail: back.searchParams.get("error_description") ?? back.searchParams.get("error") ?? undefined };
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  return exchangeError ? { status: "error", detail: exchangeError.message } : { status: "ok" };
}
