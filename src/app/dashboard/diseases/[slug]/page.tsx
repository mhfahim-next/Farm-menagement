import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DiseaseArticle } from "@/components/disease-guide";
import { PageHeader } from "@/components/ui";
import { requireFarm } from "@/lib/auth";
import { diseaseBySlug } from "@/lib/diseases";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata({ params }: PageProps<"/dashboard/diseases/[slug]">): Promise<Metadata> {
  const d = diseaseBySlug((await params).slug);
  const { t, locale } = await getI18n();
  return { title: d ? (locale === "bn" ? d.name.bn : d.name.en) : t("dis.title") };
}

export default async function DashboardDiseasePage({ params }: PageProps<"/dashboard/diseases/[slug]">) {
  const d = diseaseBySlug((await params).slug);
  if (!d) notFound();
  const { role } = await requireFarm();
  const { t, locale } = await getI18n();
  return (
    <>
      <PageHeader title={locale === "bn" ? d.name.bn : d.name.en} />
      <div className="max-w-3xl">
        <DiseaseArticle d={d} t={t} locale={locale} base="/dashboard/diseases" vetHref={role === "vet" ? "/doctor" : "/dashboard/doctors"} />
      </div>
    </>
  );
}
