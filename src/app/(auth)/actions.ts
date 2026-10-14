"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getI18n } from "@/lib/i18n/server";
import { str } from "@/lib/form";
import type { ActionState } from "@/lib/types";

function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export async function login(_: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const email = str(formData, "email");
  const password = str(formData, "password");
  if (!email || !password) return { error: t("auth.enterCredentials") };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.code === "user_banned") return { error: t("auth.banned") };
    if (error.code === "invalid_credentials") return { error: t("auth.invalidCredentials") };
    return { error: error.message };
  }

  redirect(safeNext(str(formData, "next")));
}

export async function signup(_: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const fullName = str(formData, "full_name");
  const email = str(formData, "email");
  const password = str(formData, "password");
  if (!fullName || !email || !password) return { error: t("auth.allRequired") };
  if (password.length < 8) return { error: t("auth.passwordShort") };

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? (await headers()).get("origin") ?? "";

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${origin}/auth/confirm?next=/onboarding`,
    },
  });
  if (error) {
    return { error: error.code === "user_already_exists" ? t("auth.alreadyExists") : error.message };
  }

  // Email confirmation disabled in Supabase → we already have a session.
  if (data.session) redirect("/onboarding");

  return { success: t("auth.checkEmail") };
}
