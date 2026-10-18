import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { GoogleButton } from "@/components/google-button";
import { Field, Input } from "@/components/ui";
import { getI18n } from "@/lib/i18n/server";
import { signup } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("auth.signupMeta") };
}

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const { t } = await getI18n();
  const { plan } = await searchParams;

  return (
    <>
      <h1 className="text-xl font-bold">{t("auth.signupTitle")}</h1>
      <p className="mb-6 mt-1 text-sm text-stone-500">{t("auth.signupSubtitle")}</p>
      <GoogleButton
        next={typeof plan === "string" && /^[a-z][a-z0-9_]{1,29}$/.test(plan) ? `/onboarding?plan=${plan}` : "/onboarding"}
      />
      <ActionForm action={signup} submitLabel={t("auth.signupSubmit")} fullWidthSubmit>
        <input type="hidden" name="plan" value={typeof plan === "string" ? plan : ""} />
        <Field label={t("auth.fullName")}>
          <Input name="full_name" autoComplete="name" required />
        </Field>
        <Field label={t("common.email")}>
          <Input name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label={t("common.password")} hint={t("auth.passwordHint")}>
          <Input name="password" type="password" autoComplete="new-password" minLength={8} required />
        </Field>
      </ActionForm>
      <p className="mt-4 text-center text-xs text-stone-500">
        {t("legal.agreePrefix")}{" "}
        <Link href="/terms" className="font-medium text-emerald-700 hover:underline">{t("legal.terms")}</Link>{" "}
        {t("legal.and")}{" "}
        <Link href="/privacy" className="font-medium text-emerald-700 hover:underline">{t("legal.privacy")}</Link>
        {t("legal.agreeSuffix")}
      </p>
      <p className="mt-4 text-center text-xs text-stone-500">
        {t("doctor.areDoctor")}{" "}
        <Link href="/doctor/signup" className="font-medium text-emerald-700 hover:underline">
          {t("doctor.doctorSignup")}
        </Link>
      </p>
      <p className="mt-3 text-center text-sm text-stone-500">
        {t("auth.alreadyRegistered")}{" "}
        <Link href="/login" className="font-medium text-emerald-700 hover:underline">
          {t("auth.loginLink")}
        </Link>
      </p>
    </>
  );
}
