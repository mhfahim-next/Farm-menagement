import type { Metadata } from "next";
import { ActionForm } from "@/components/action-form";
import { Card, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { SentryTest } from "@/components/sentry-test";
import { requireSuperAdmin } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { saveAnnouncement, saveBreedingRules, saveLivestockRules } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("admin.announceTitle") };
}

export default async function AdminSettingsPage() {
  const { supabase } = await requireSuperAdmin();
  const { t } = await getI18n();
  const sentryOn = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);

  const { data } = await supabase
    .from("system_settings")
    .select("announcement_en, announcement_bn, announcement_active, payment_instructions_en, payment_instructions_bn, pregnancy_check_days, goat_gestation_days, sheep_gestation_days, qurbani_date")
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

      <Card title={t("adminlive.title")} description={t("adminlive.desc")} className="mt-6 max-w-2xl">
        <ActionForm action={saveLivestockRules} submitLabel={t("adminlive.save")}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label={t("adminlive.goat")}>
              <Input name="goat_gestation_days" type="number" min="130" max="170" required defaultValue={(data as Record<string, number> | null)?.goat_gestation_days ?? 150} />
            </Field>
            <Field label={t("adminlive.sheep")}>
              <Input name="sheep_gestation_days" type="number" min="130" max="170" required defaultValue={(data as Record<string, number> | null)?.sheep_gestation_days ?? 147} />
            </Field>
            <Field label={t("adminlive.qurbani")}>
              <Input name="qurbani_date" type="date" defaultValue={(data as Record<string, string> | null)?.qurbani_date ?? ""} />
            </Field>
          </div>
        </ActionForm>
      </Card>
      <Card title={t("adminsentry.title")} className="mt-6 max-w-2xl">
        <p className={`mb-3 text-sm ${sentryOn ? "text-emerald-700" : "text-amber-700"}`} data-testid="sentry-status">
          {sentryOn ? `✓ ${t("adminsentry.on")}` : t("adminsentry.off")}
        </p>
        <SentryTest enabled={sentryOn} />
      </Card>
    </>
  );
}
