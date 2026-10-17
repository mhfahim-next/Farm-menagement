import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { LimitNotice } from "@/components/limit-notice";
import { ButtonLink, Card, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { MANAGERS, requireRole, STAFF } from "@/lib/auth";
import { breedOptions } from "@/lib/cattle";
import { today } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { planName } from "@/lib/plan-utils";
import { getPlanContext } from "@/lib/plans";
import { addFlock } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("flocks.addTitle") };
}

export default async function NewFlockPage() {
  const { farm, role } = await requireRole(STAFF);
  if (!farm.has_layer) notFound();
  const i18n = await getI18n();
  const { t, locale } = i18n;
  const { plan, usage, limits, states } = await getPlanContext();
  const atLimit = states.flocks === "full" || states.flocks === "over";

  return (
    <>
      <PageHeader
        title={t("flocks.addTitle")}
        description={t("flocks.newDesc")}
        action={<ButtonLink href="/dashboard/flocks" variant="secondary">{t("common.back")}</ButtonLink>}
      />
      <Card className="max-w-2xl">
        <LimitNotice
          t={t}
          kind="flocks"
          state={states.flocks}
          used={usage.flocks}
          max={limits.flocks}
          plan={planName(plan, locale)}
          canUpgrade={MANAGERS.includes(role)}
        />
        {!atLimit && (
          <ActionForm action={addFlock} submitLabel={t("flocks.addSubmit")} successHref="/dashboard/flocks">
            <Field label={t("flocks.flockName")}>
              <Input name="name" placeholder={t("flocks.flockNamePlaceholder")} required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("common.breed")}>
                <Select name="breed" options={breedOptions(i18n, "flock_breed")} />
              </Field>
              <Field label={t("flocks.shedLabel")}>
                <Input name="shed" />
              </Field>
              <Field label={t("flocks.birdsPlaced")}>
                <Input name="initial_count" type="number" min="1" required />
              </Field>
              <Field label={t("flocks.ageAtPlacement")}>
                <Input name="age_at_placement_weeks" type="number" min="0" defaultValue="0" />
              </Field>
            </div>
            <Field label={t("flocks.placedOn")}>
              <Input name="placed_date" type="date" defaultValue={today()} required />
            </Field>
            <Field label={t("common.notes")}>
              <Textarea name="notes" rows={2} />
            </Field>
          </ActionForm>
        )}
      </Card>
    </>
  );
}
