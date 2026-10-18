"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getI18n } from "@/lib/i18n/server";
import { str } from "@/lib/form";
import type { ActionState } from "@/lib/types";
import { recordPresence } from "@/lib/geo";

function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export async function login(_: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const email = str(formData, "email");
  const password = str(formData, "password");
  if (!email || !password) return { error: t("auth.enterCredentials") };

  const supabase = await createClient();
  const { data: signedIn, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.code === "user_banned") return { error: t("auth.banned") };
    if (error.code === "invalid_credentials") return { error: t("auth.invalidCredentials") };
    return { error: error.message };
  }
  await recordPresence(supabase, "login");

  // Doctors have no farm of their own: send them to their console by default.
  const wanted = str(formData, "next");
  if (!wanted && signedIn.user) {
    const { data: profile } = await supabase.from("profiles").select("account_type").eq("id", signedIn.user.id).maybeSingle();
    if (profile?.account_type === "doctor") redirect("/doctor");
  }
  redirect(safeNext(wanted));
}

export async function signupDoctor(_: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const fullName = str(formData, "full_name");
  const email = str(formData, "email");
  const password = str(formData, "password");
  const regNo = str(formData, "doctor_reg_no");
  if (!fullName || !email || !password) return { error: t("auth.allRequired") };
  if (!regNo) return { error: t("doctor.regRequired") };
  if (password.length < 8) return { error: t("auth.passwordShort") };

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        account_type: "doctor",
        doctor_reg_no: regNo,
        doctor_specialty: str(formData, "doctor_specialty") ?? "",
        phone: str(formData, "phone") ?? "",
      },
      emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent("/doctor")}`,
    },
  });
  if (error) {
    return { error: error.code === "user_already_exists" ? t("auth.alreadyExists") : error.message };
  }
  if (data.session) {
    await recordPresence(supabase, "signup");
    redirect("/doctor");
  }
  return { success: t("auth.checkEmail") };
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
  // A plan picked on the home page is carried through sign-up to onboarding.
  const chosen = str(formData, "plan");
  const next = chosen && /^[a-z][a-z0-9_]{1,29}$/.test(chosen) ? `/onboarding?plan=${chosen}` : "/onboarding";

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) {
    return { error: error.code === "user_already_exists" ? t("auth.alreadyExists") : error.message };
  }

  // Email confirmation disabled in Supabase → we already have a session.
  if (data.session) {
    await recordPresence(supabase, "signup");
    redirect(next);
  }

  return { success: t("auth.checkEmail") };
}
