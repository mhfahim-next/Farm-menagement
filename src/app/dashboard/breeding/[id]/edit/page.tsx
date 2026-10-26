import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BreedingForm } from "@/components/breeding-form";
import { ConfirmForm } from "@/components/confirm-form";
import { Card, PageHeader } from "@/components/ui";
import { MANAGERS, requireFarm } from "@/lib/auth";
import { animalLabel } from "@/lib/cattle";
import { getBreedingRules } from "@/lib/breeding-data";
import { today } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import type { BreedingEvent } from "@/lib/types";
import { deleteBreedingEvent, updateBreedingEvent } from "../../actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("breeding.editTitle") };
}

export default async function EditBreedingPage({ params }: PageProps<"/dashboard/breeding/[id]/edit">) {
  const { id } = await params;
  const { supabase, farm, role } = await requireFarm();
  const { t } = await getI18n();

  const { data } = await supabase.from("breeding_events").select("*").eq("id", id).eq("farm_id", farm.id).maybeSingle();
  const record = data as BreedingEvent | null;
  if (!record) notFound();
  const { data: cow } = await supabase.from("cattle").select("id, tag_number, name, species").eq("id", record.cattle_id).eq("farm_id", farm.id).maybeSingle();
  const rules = await getBreedingRules({ supabase }, cow?.species);

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
          species={cow?.species ?? "cattle"}
        />
      </Card>
      {MANAGERS.includes(role) && (
        <div className="mt-4 max-w-xl">
          <ConfirmForm
            action={deleteBreedingEvent}
            fields={{ id: record.id }}
            label={t("common.delete")}
            confirm={t("breeding.confirmDelete")}
            variant="danger"
            successHref={cow ? `/dashboard/cattle/${cow.id}` : "/dashboard/breeding"}
          />
        </div>
      )}
    </>
  );
}
