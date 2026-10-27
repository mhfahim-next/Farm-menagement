import type { Metadata } from "next";
import { ActionForm } from "@/components/action-form";
import { AvatarUploader } from "@/components/avatar-uploader";
import { Card, Field, Input, PageHeader } from "@/components/ui";
import { getProfile, requireUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { changePassword, deleteAccount, updateProfile } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("profile.meta") };
}

export default async function ProfilePage() {
  const user = await requireUser();
  const profile = await getProfile();
  const { t } = await getI18n();

  return (
    <>
      <PageHeader title={t("profile.title")} description={t("profile.desc")} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={t("profile.photoTitle")} className="lg:col-span-2">
          <AvatarUploader
            userId={user.id}
            avatarUrl={profile?.avatar_url ?? null}
            name={profile?.full_name ?? null}
            email={user.email ?? null}
          />
        </Card>

        <Card title={t("profile.detailsTitle")}>
          <ActionForm action={updateProfile} submitLabel={t("profile.saveDetails")}>
            <Field label={t("profile.fullName")}>
              <Input name="full_name" defaultValue={profile?.full_name ?? ""} required />
            </Field>
            <Field label={t("common.phone")}>
              <Input name="phone" type="tel" defaultValue={profile?.phone ?? ""} />
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

        <Card title={t("profile.deleteTitle")} className="border-red-200 lg:col-span-2">
          <p className="mb-3 text-sm text-stone-700">{t("profile.deleteBody")}</p>
          <ActionForm action={deleteAccount} submitLabel={t("profile.deleteButton")} submitVariant="danger">
            <Field label={t("profile.deleteType", { word: t("profile.deleteWord") })}>
              <Input name="confirm" autoComplete="off" required />
            </Field>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
