import type { Metadata } from "next";
import { DiseaseGuide } from "@/components/disease-guide";
import { PageHeader } from "@/components/ui";
import { requireFarm } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("dis.title") };
}

export default async function DashboardDiseasesPage() {
  await requireFarm();
  const { t, locale } = await getI18n();
  return (
    <>
      <PageHeader title={t("dis.title")} description={t("dis.intro")} />
      <div className="max-w-4xl">
        <DiseaseGuide t={t} locale={locale} base="/dashboard/diseases" />
      </div>
    </>
  );
}
