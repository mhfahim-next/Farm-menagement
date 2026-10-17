import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BreedingForm } from "@/components/breeding-form";
import { Card, PageHeader } from "@/components/ui";
import { requireFarm } from "@/lib/auth";
import { animalLabel } from "@/lib/cattle";
import { getBreedingRules } from "@/lib/breeding-data";
import { today } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import type { BreedingEvent } from "@/lib/types";
import { updateBreedingEvent } from "../../actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("breeding.editTitle") };
}

export default async function EditBreedingPage({ params }: PageProps<"/dashboard/breeding/[id]/edit">) {
  const { id } = await params;
  const { supabase, farm } = await requireFarm();
  const { t } = await getI18n();

  const { data } = await supabase.from("breeding_events").select("*").eq("id", id).eq("farm_id", farm.id).maybeSingle();
  const record = data as BreedingEvent | null;
  if (!record) notFound();
  const [{ data: cow }, rules] = await Promise.all([
    supabase.from("cattle").select("id, tag_number, name").eq("id", record.cattle_id).eq("farm_id", farm.id).maybeSingle(),
    getBreedingRules({ supabase }),
  ]);

  return (
    <>
      <PageHeader
        title={t("breeding.editTitle")}
        description={cow ? animalLabel(cow) : undefined}
        action={
          <Link href={cow ? `/dashboard/cattle/${cow.id}` : "/dashboard/breeding"} className="text-sm text-stone-500 hover:text-stone-900">
            {t("common.back")}
          </Link>
        }
      />
      <Card className="max-w-xl">
        <BreedingForm
          action={updateBreedingEvent}
          today={today()}
          currency={farm.currency}
          cattleId={record.cattle_id}
          checkDays={rules.pregnancyCheckDays}
          gestationDays={rules.gestationDays}
          record={record}
        />
      </Card>
    </>
  );
}
