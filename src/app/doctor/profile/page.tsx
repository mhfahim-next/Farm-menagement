import type { Metadata } from "next";
import { ActionForm } from "@/components/action-form";
import { AvatarUploader } from "@/components/avatar-uploader";
import { Badge, Card, Field, Input, PageHeader, Select } from "@/components/ui";
import { requireDoctor } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { changePassword, updateProfile } from "@/app/dashboard/profile/actions";
import { updateDoctorDetails } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("profile.meta") };
}

export default async function DoctorProfilePage() {
  const { user, profile } = await requireDoctor();
  const { t, options } = await getI18n();

  return (
    <>
      <PageHeader title={t("profile.title")} description={t("profile.desc")} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={t("profile.photoTitle")} className="lg:col-span-2">
          <AvatarUploader userId={user.id} avatarUrl={profile.avatar_url} name={profile.full_name} email={user.email ?? null} />
        </Card>

        <Card title={t("doctor.detailsTitle")} action={<Badge tone={profile.doctor_verified ? "green" : "amber"}>{profile.doctor_verified ? t("doctor.badgeVerified") : t("doctor.badgeUnverified")}</Badge>}>
          <ActionForm action={updateDoctorDetails} submitLabel={t("profile.saveDetails")}>
            <Field label={t("doctor.regNo")} hint={t("doctor.regNoHint")}>
              <Input name="doctor_reg_no" defaultValue={profile.doctor_reg_no ?? ""} required maxLength={60} />
            </Field>
            <Field label={t("doctor.specialty")}>
              <Select
                name="doctor_specialty"
                defaultValue={profile.doctor_specialty ?? ""}
                options={[{ value: "", label: t("doctor.chooseSpecialty") }, ...options("doctor_specialty", profile.doctor_specialty)]}
              />
            </Field>
          </ActionForm>
        </Card>

        <Card title={t("profile.detailsTitle")}>
          <ActionForm action={updateProfile} submitLabel={t("profile.saveDetails")}>
            <Field label={t("profile.fullName")}>
              <Input name="full_name" defaultValue={profile.full_name ?? ""} required />
            </Field>
            <Field label={t("common.phone")}>
              <Input name="phone" type="tel" defaultValue={profile.phone ?? ""} />
            </Field>
            <Field label={t("common.email")} hint={t("profile.emailHint")}>
              <Input value={user.email ?? ""} readOnly disabled />
            </Field>
          </ActionForm>
        </Card>

        <Card title={t("profile.passwordTitle")}>
          <ActionForm action={changePassword} submitLabel={t("profile.updatePassword")} submitVariant="secondary">
            <Field label={t("profile.newPassword")} hint={t("auth.passwordHint")}>
              <Input name="password" type="password" autoComplete="new-password" minLength={8} required />
            </Field>
            <Field label={t("profile.confirmPassword")}>
              <Input name="confirm" type="password" autoComplete="new-password" minLength={8} required />
            </Field>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
