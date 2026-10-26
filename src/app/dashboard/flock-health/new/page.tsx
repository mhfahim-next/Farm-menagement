import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FlockHealthForm } from "@/components/flock-health-form";
import { ButtonLink, Card, EmptyState, PageHeader } from "@/components/ui";
import { requireRole, STAFF } from "@/lib/auth";
import { today } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { recordFlockHealth } from "../actions";
import { keepsPoultry } from "@/lib/modules";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("flockHealth.recordTitle") };
}

export default async function NewFlockHealthPage({ searchParams }: PageProps<"/dashboard/flock-health/new">) {
  const { supabase, farm } = await requireRole(STAFF);
  if (!keepsPoultry(farm)) notFound();
  const { t } = await getI18n();
  const sp = await searchParams;

  const { data } = await supabase
    .from("flocks")
    .select("id, name")
    .eq("farm_id", farm.id)
    .eq("status", "active")
    .is("deleted_at", null)
    .order("name");
  const flocks = data ?? [];
  const preselect = typeof sp.flock === "string" ? flocks.find((fl) => fl.id === sp.flock) : undefined;

  return (
    <>
      <PageHeader
        title={t("flockHealth.recordTitle")}
        description={t("flockHealth.recordDesc")}
        action={<ButtonLink href="/dashboard/flock-health" variant="secondary">{t("common.back")}</ButtonLink>}
      />
      <Card className="max-w-2xl">
        {flocks.length === 0 ? (
          <EmptyState title={t("flockHealth.noFlocksTitle")}>{t("flockHealth.noFlocksBody")}</EmptyState>
        ) : (
          <FlockHealthForm
            action={recordFlockHealth}
            today={today()}
            currency={farm.currency}
            successHref="/dashboard/flock-health"
            flocks={preselect ? [{ id: preselect.id, label: preselect.name }] : flocks.map((fl) => ({ id: fl.id, label: fl.name }))}
          />
        )}
      </Card>
    </>
  );
}
