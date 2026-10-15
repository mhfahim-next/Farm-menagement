import type { Metadata } from "next";
import { ActionForm } from "@/components/action-form";
import { Card, Field, PageHeader, Textarea } from "@/components/ui";
import { requireSuperAdmin } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { saveAnnouncement, savePaymentInstructions } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("admin.announceTitle") };
}

export default async function AdminSettingsPage() {
  const { supabase } = await requireSuperAdmin();
  const { t } = await getI18n();

  const { data } = await supabase
    .from("system_settings")
    .select("announcement_en, announcement_bn, announcement_active, payment_instructions_en, payment_instructions_bn")
    .eq("id", 1)
    .maybeSingle();

  return (
    <>
      <PageHeader title={t("admin.announceTitle")} description={t("admin.announceDesc")} />
      <Card className="max-w-2xl">
        <ActionForm action={saveAnnouncement} submitLabel={t("admin.announceSave")}>
          <Field label={t("admin.announceEn")}>
            <Textarea name="announcement_en" rows={2} defaultValue={data?.announcement_en ?? ""} />
          </Field>
          <Field label={t("admin.announceBn")} hint={t("admin.announceHint")}>
            <Textarea name="announcement_bn" rows={2} defaultValue={data?.announcement_bn ?? ""} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="active" defaultChecked={data?.announcement_active ?? false} className="accent-emerald-700" />
            {t("admin.announceActive")}
          </label>
        </ActionForm>
      </Card>

      <Card title={t("admin.payment.title")} description={t("admin.payment.desc")} className="mt-6 max-w-2xl">
        <ActionForm action={savePaymentInstructions} submitLabel={t("admin.payment.save")}>
          <Field label={t("admin.payment.en")}>
            <Textarea name="payment_en" rows={4} defaultValue={data?.payment_instructions_en ?? ""} />
          </Field>
          <Field label={t("admin.payment.bn")}>
            <Textarea name="payment_bn" rows={4} defaultValue={data?.payment_instructions_bn ?? ""} />
          </Field>
        </ActionForm>
      </Card>
    </>
  );
}
