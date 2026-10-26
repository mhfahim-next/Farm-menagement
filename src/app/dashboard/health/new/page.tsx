import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HealthForm } from "@/components/health-form";
import { ButtonLink, Card, EmptyState, PageHeader } from "@/components/ui";
import { requireFarm } from "@/lib/auth";
import { milkingCategories } from "@/lib/cattle";
import { today } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { recordHealth } from "../actions";
import { keepsAnimals } from "@/lib/modules";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("health.recordTitle") };
}

export default async function NewHealthPage() {
  const { supabase, farm } = await requireFarm();
  if (!keepsAnimals(farm)) notFound();
  const { t, rows } = await getI18n();
  const { data } = await supabase
    .from("cattle")
    .select("id, tag_number, name, category")
    .eq("farm_id", farm.id)
    .eq("status", "active")
    .is("deleted_at", null)
    .order("tag_number");
  const active = data ?? [];
  const milking = milkingCategories(rows);

  return (
    <>
      <PageHeader
        title={t("health.recordTitle")}
        description={t("health.recordDesc")}
        action={<ButtonLink href="/dashboard/health" variant="secondary">{t("common.back")}</ButtonLink>}
      />
      <Card className="max-w-2xl">
        {active.length === 0 ? (
          <EmptyState title={t("health.noActiveTitle")}>{t("health.noActiveBody")}</EmptyState>
        ) : (
          <HealthForm
            action={recordHealth}
            today={today()}
            currency={farm.currency}
            successHref="/dashboard/health"
            animals={active.map((c) => ({
              id: c.id,
              label: `${c.tag_number}${c.name ? ` · ${c.name}` : ""}`,
              milking: milking.includes(c.category),
            }))}
          />
        )}
      </Card>
    </>
  );
}
