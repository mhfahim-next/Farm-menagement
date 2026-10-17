import type { Metadata } from "next";
import { ActionForm } from "@/components/action-form";
import { Card, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { requireSuperAdmin } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { saveAnnouncement, savePaymentInstructions, saveBreedingRules } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("admin.announceTitle") };
}

export default async function AdminSettingsPage() {
  const { supabase } = await requireSuperAdmin();
  const { t } = await getI18n();

  const { data } = await supabase
    .from("system_settings")
    .select("announcement_en, announcement_bn, announcement_active, payment_instructions_en, payment_instructions_bn, pregnancy_check_days")
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

      <Card title={t("admin.breedingRules.title")} description={t("admin.breedingRules.desc")} className="mt-6 max-w-2xl">
        <ActionForm action={saveBreedingRules} submitLabel={t("admin.breedingRules.save")}>
          <Field label={t("admin.breedingRules.checkDays")} hint={t("admin.breedingRules.checkDaysHint")}>
            <Input
              name="pregnancy_check_days"
              type="number"
              min={20}
              max={120}
              step={1}
              required
              defaultValue={data?.pregnancy_check_days ?? 45}
            />
          </Field>
          {(
            [
              ["gestation_days", "gestation", 240, 320, 283],
              ["heat_cycle_days", "heat", 14, 30, 21],
              ["dry_off_days", "dryOff", 30, 90, 60],
              ["voluntary_wait_days", "wait", 20, 150, 60],
            ] as const
          ).map(([name, key, min, max, def]) => (
            <Field key={name} label={t(`admin.breedingRules.${key}`)} hint={t(`admin.breedingRules.${key}Hint`)}>
              <Input
                name={name}
                type="number"
                min={min}
                max={max}
                step={1}
                required
                defaultValue={(data as Record<string, number> | null)?.[name] ?? def}
              />
            </Field>
          ))}
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
