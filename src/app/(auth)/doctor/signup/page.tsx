import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { Field, Input, Select } from "@/components/ui";
import { getI18n } from "@/lib/i18n/server";
import { signupDoctor } from "../../actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("doctor.signupMeta") };
}

export default async function DoctorSignupPage() {
  const { t, options } = await getI18n();

  return (
    <>
      <h1 className="text-xl font-bold">{t("doctor.signupTitle")}</h1>
      <p className="mb-6 mt-1 text-sm text-stone-500">{t("doctor.signupSubtitle")}</p>
      <ActionForm action={signupDoctor} submitLabel={t("doctor.signupSubmit")} fullWidthSubmit>
        <Field label={t("auth.fullName")}>
          <Input name="full_name" autoComplete="name" required />
        </Field>
        <Field label={t("common.email")}>
          <Input name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label={t("common.password")} hint={t("auth.passwordHint")}>
          <Input name="password" type="password" autoComplete="new-password" minLength={8} required />
        </Field>
        <Field label={t("doctor.regNo")} hint={t("doctor.regNoHint")}>
          <Input name="doctor_reg_no" required maxLength={60} />
        </Field>
        <Field label={t("doctor.specialty")}>
          <Select name="doctor_specialty" options={[{ value: "", label: t("doctor.chooseSpecialty") }, ...options("doctor_specialty")]} />
        </Field>
        <Field label={t("common.phone")}>
          <Input name="phone" type="tel" autoComplete="tel" />
        </Field>
      </ActionForm>
      <p className="mt-6 text-center text-sm text-stone-500">
        {t("auth.alreadyRegistered")}{" "}
        <Link href="/login" className="font-medium text-emerald-700 hover:underline">
          {t("auth.loginLink")}
        </Link>
      </p>
      <p className="mt-3 text-center text-xs text-stone-500">
        {t("doctor.areFarmer")}{" "}
        <Link href="/signup" className="font-medium text-emerald-700 hover:underline">
          {t("doctor.farmerSignup")}
        </Link>
      </p>
    </>
  );
}
