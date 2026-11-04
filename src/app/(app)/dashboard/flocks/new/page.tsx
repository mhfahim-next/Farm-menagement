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
import { keepsPoultry } from "@/lib/modules";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("flocks.addTitle") };
}

export default async function NewFlockPage({ searchParams }: PageProps<"/dashboard/flocks/new">) {
  const { farm, role } = await requireRole(STAFF);
  if (!keepsPoultry(farm)) notFound();
  const i18n = await getI18n();
  const { t, locale } = i18n;
  const { plan, usage, limits, states } = await getPlanContext();
  const atLimit = states.flocks === "full" || states.flocks === "over";
  const sp = await searchParams;
  // Layer flock or a meat batch (broiler / Sonali), from the link or what the farm keeps.
  const wanted = sp.kind === "broiler" || sp.kind === "sonali" ? sp.kind : sp.kind === "layer" ? "layer" : null;
  const kind = (wanted === "layer" && farm.has_layer) || (wanted && wanted !== "layer" && farm.has_broiler) ? wanted : farm.has_layer ? "layer" : "broiler";
  const meat = kind !== "layer";
  const back = meat ? "/dashboard/broilers" : "/dashboard/flocks";
  const breeds = breedOptions(i18n, "flock_breed").filter(
    (b) => b.value === "" || b.value === "Other" || (meat ? b.meta.kind === "meat" || b.value === "Sonali" : b.meta.kind !== "meat"),
  );

  return (
    <>
      <PageHeader
        title={meat ? t("broiler.addTitle") : t("flocks.addTitle")}
        description={meat ? t("broiler.newDesc") : t("flocks.newDesc")}
        action={<ButtonLink href={back} variant="secondary">{t("common.back")}</ButtonLink>}
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
          <ActionForm action={addFlock} submitLabel={meat ? t("broiler.addSubmit") : t("flocks.addSubmit")} successHref={back}>
            {meat ? (
              <Field label={t("broiler.kind")}>
                <Select
                  name="kind"
                  defaultValue={kind}
                  options={[
                    { value: "broiler", label: t("broiler.kind.broiler") },
                    { value: "sonali", label: t("broiler.kind.sonali") },
                  ]}
                />
              </Field>
            ) : (
              <input type="hidden" name="kind" value="layer" />
            )}
            <Field label={meat ? t("broiler.batchName") : t("flocks.flockName")}>
              <Input name="name" placeholder={meat ? t("broiler.batchNamePlaceholder") : t("flocks.flockNamePlaceholder")} required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("common.breed")}>
                <Select name="breed" options={breeds} />
              </Field>
              <Field label={t("flocks.shedLabel")}>
                <Input name="shed" />
              </Field>
              <Field label={meat ? t("broiler.chicksPlaced") : t("flocks.birdsPlaced")}>
                <Input name="initial_count" type="number" min="1" required />
              </Field>
              {meat ? (
                <Field label={t("broiler.chickPrice", { cur: farm.currency })} hint={t("broiler.chickPriceHint")}>
                  <Input name="chick_price" type="number" min="0" step="0.01" inputMode="decimal" />
                </Field>
              ) : (
                <Field label={t("flocks.ageAtPlacement")}>
                  <Input name="age_at_placement_weeks" type="number" min="0" defaultValue="0" />
                </Field>
              )}
            </div>
            <Field label={meat ? t("broiler.placedOn") : t("flocks.placedOn")}>
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
