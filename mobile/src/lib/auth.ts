import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "./supabase";

export { authErrorKey, isEmail } from "./auth-errors";

WebBrowser.maybeCompleteAuthSession();

/**
 * "Continue with Google": Supabase sends the browser to Google, which comes back
 * to farmflows://auth/callback with a one-time code. Add that address to
 * Supabase → Authentication → URL Configuration → Redirect URLs.
 */
export async function signInWithGoogle(): Promise<"ok" | "cancelled" | "error"> {
  const redirectTo = makeRedirectUri({ scheme: "farmflows", path: "auth/callback" });
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, skipBrowserRedirect: true, queryParams: { prompt: "select_account" } },
  });
  if (error || !data.url) return "error";
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success") return "cancelled";
  const code = new URL(result.url).searchParams.get("code");
  if (!code) return "error";
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  return exchangeError ? "error" : "ok";
}
