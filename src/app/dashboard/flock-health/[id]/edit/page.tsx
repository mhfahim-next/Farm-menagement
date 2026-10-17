import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConfirmForm } from "@/components/confirm-form";
import { FlockHealthForm } from "@/components/flock-health-form";
import { ButtonLink, Card, PageHeader } from "@/components/ui";
import { requireRole, STAFF } from "@/lib/auth";
import { today } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import type { FlockHealthRecord } from "@/lib/types";
import { deleteFlockHealth, updateFlockHealth } from "../../actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("flockHealth.editTitle") };
}

export default async function EditFlockHealthPage({ params }: PageProps<"/dashboard/flock-health/[id]/edit">) {
  const { id } = await params;
  const { supabase, farm } = await requireRole(STAFF);
  const { t } = await getI18n();

  const { data } = await supabase.from("flock_health_records").select("*").eq("id", id).eq("farm_id", farm.id).maybeSingle();
  const record = data as FlockHealthRecord | null;
  if (!record) notFound();
  const { data: flock } = await supabase.from("flocks").select("name").eq("id", record.flock_id).eq("farm_id", farm.id).maybeSingle();

  return (
    <>
      <PageHeader
        title={t("flockHealth.editTitle")}
        description={flock?.name}
        action={<ButtonLink href="/dashboard/flock-health" variant="secondary">{t("common.back")}</ButtonLink>}
      />
      <Card className="max-w-2xl">
        <FlockHealthForm action={updateFlockHealth} today={today()} currency={farm.currency} record={record} successHref="/dashboard/flock-health" />
      </Card>
      <div className="mt-4">
        <ConfirmForm
          action={deleteFlockHealth}
          fields={{ id: record.id }}
          label={t("common.delete")}
          variant="danger"
          successHref="/dashboard/flock-health"
          confirm={t("flockHealth.confirmDelete")}
        />
      </div>
    </>
  );
}
