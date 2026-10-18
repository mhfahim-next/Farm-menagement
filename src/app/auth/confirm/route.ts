import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { recordPresence } from "@/lib/geo";
import { createClient } from "@/lib/supabase/server";

// Target of the links in Supabase auth emails (signup confirmation,
// magic link, password recovery).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  // Google (or the user) cancelled / refused the sign-in.
  if (searchParams.get("error")) return NextResponse.redirect(new URL("/login?error=oauth", origin));
  const nextParam = searchParams.get("next") ?? "/dashboard";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/dashboard";

  const supabase = await createClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      await recordPresence(supabase, type === "signup" ? "signup" : "login");
      return NextResponse.redirect(new URL(next, origin));
    }
  } else if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Google sign-in creates the account on first use: count that as a sign-up.
      const isNew = !!data.user && Date.now() - Date.parse(data.user.created_at) < 2 * 60_000;
      await recordPresence(supabase, isNew ? "signup" : "login");
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=link", origin));
}
