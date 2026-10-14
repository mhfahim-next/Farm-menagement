import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { Field, Input } from "@/components/ui";
import { getI18n } from "@/lib/i18n/server";
import { signup } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("auth.signupMeta") };
}

export default async function SignupPage() {
  const { t } = await getI18n();

  return (
    <>
      <h1 className="text-xl font-bold">{t("auth.signupTitle")}</h1>
      <p className="mb-6 mt-1 text-sm text-stone-500">{t("auth.signupSubtitle")}</p>
      <ActionForm action={signup} submitLabel={t("auth.signupSubmit")} fullWidthSubmit>
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
      <p className="mt-6 text-center text-sm text-stone-500">
        {t("auth.alreadyRegistered")}{" "}
        <Link href="/login" className="font-medium text-emerald-700 hover:underline">
          {t("auth.loginLink")}
        </Link>
      </p>
    </>
  );
}
