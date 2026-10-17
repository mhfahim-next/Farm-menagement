import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BreedingForm } from "@/components/breeding-form";
import { ButtonLink, Card, EmptyState, PageHeader } from "@/components/ui";
import { requireFarm } from "@/lib/auth";
import { loadBreedingBoard } from "@/lib/breeding-data";
import { today } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { logBreedingEvent } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("breeding.recordTitle") };
}

export default async function NewBreedingPage() {
  const { supabase, farm } = await requireFarm();
  if (!farm.has_dairy) notFound();
  const { t } = await getI18n();
  const { cows, rules, checkDays } = await loadBreedingBoard({ supabase, farm });

  return (
    <>
      <PageHeader
        title={t("breeding.recordTitle")}
        description={t("breeding.desc")}
        action={<ButtonLink href="/dashboard/breeding" variant="secondary">{t("common.back")}</ButtonLink>}
      />
      <Card className="max-w-2xl">
        {cows.length === 0 ? (
          <EmptyState title={t("breeding.noCowsTitle")}>{t("breeding.noCowsBody")}</EmptyState>
        ) : (
          <BreedingForm
            action={logBreedingEvent}
            today={today()}
            currency={farm.currency}
            checkDays={checkDays}
            gestationDays={rules.gestationDays}
            successHref="/dashboard/breeding"
            cows={cows.map((c) => ({ id: c.id, label: `${c.tag_number}${c.name ? ` · ${c.name}` : ""}` }))}
          />
        )}
      </Card>
    </>
  );
}
