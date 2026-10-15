import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HealthForm } from "@/components/health-form";
import { Card, PageHeader } from "@/components/ui";
import { requireFarm } from "@/lib/auth";
import { animalLabel } from "@/lib/cattle";
import { today } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import type { HealthRecord } from "@/lib/types";
import { updateHealth } from "../../actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("health.editTitle") };
}

export default async function EditHealthPage({ params }: PageProps<"/dashboard/health/[id]/edit">) {
  const { id } = await params;
  const { supabase, farm } = await requireFarm();
  const { t } = await getI18n();

  const { data } = await supabase.from("health_records").select("*").eq("id", id).eq("farm_id", farm.id).maybeSingle();
  const record = data as HealthRecord | null;
  if (!record) notFound();
  const { data: cow } = await supabase
    .from("cattle")
    .select("id, tag_number, name")
    .eq("id", record.cattle_id)
    .eq("farm_id", farm.id)
    .maybeSingle();

  return (
    <>
      <PageHeader
        title={t("health.editTitle")}
        description={cow ? animalLabel(cow) : undefined}
        action={
          <Link href={cow ? `/dashboard/cattle/${cow.id}` : "/dashboard/health"} className="text-sm text-stone-500 hover:text-stone-900">
            {t("common.back")}
          </Link>
        }
      />
      <Card className="max-w-xl">
        <HealthForm action={updateHealth} today={today()} currency={farm.currency} record={record} />
      </Card>
    </>
  );
}
