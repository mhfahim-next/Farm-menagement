import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { LimitNotice } from "@/components/limit-notice";
import { ParentsFields } from "@/components/parents-fields";
import { ButtonLink, Card, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { MANAGERS, requireFarm } from "@/lib/auth";
import { breedOptions, categoryOptions, GROUP_SPECIES, typeSexHint, type AnimalGroup, type MotherCandidate } from "@/lib/cattle";
import { getI18n } from "@/lib/i18n/server";
import { planName } from "@/lib/plan-utils";
import { getPlanContext } from "@/lib/plans";
import { addCattle } from "../actions";
import { fattens, keepsAnimals, keepsCattle } from "@/lib/modules";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("cattle.addTitle") };
}

export default async function NewCattlePage({ searchParams }: PageProps<"/dashboard/cattle/new">) {
  const { supabase, farm, role } = await requireFarm();
  if (!keepsAnimals(farm)) notFound();
  if (role === "vet") redirect("/dashboard/cattle");
  const i18n = await getI18n();
  const { t, locale } = i18n;
  const { plan, usage, limits, states } = await getPlanContext();
  const sp = await searchParams;
  // Goats & sheep, or cattle: from the link, else what the farm keeps.
  const group: AnimalGroup = (sp.species === "goat" || sp.species === "sheep" || !keepsCattle(farm)) && farm.has_goat ? "small" : "cattle";
  const small = group === "small";
  const limitKey = small ? "goats" : "cattle";
  const atLimit = states[limitKey] === "full" || states[limitKey] === "over";
  const fattening = fattens(farm);
  const forFattening = sp.fattening === "1";
  const back = forFattening ? "/dashboard/fattening" : small ? "/dashboard/goats" : "/dashboard/cattle";
  const breeds = small
    ? breedOptions(i18n, "cattle_breed").filter((b) => b.value === "" || b.value === "Other" || b.meta.species === "goat" || b.meta.species === "sheep")
    : breedOptions(i18n, "cattle_breed", null, "cattle");

  // Every female on the farm can be picked as a mother (even if sold or dead).
  const { data } = await supabase
    .from("cattle")
    .select("id, tag_number, name, category, status")
    .eq("farm_id", farm.id)
    .eq("sex", "female")
    .in("species", GROUP_SPECIES[group])
    .is("deleted_at", null)
    .order("tag_number");
  const mothers = (data ?? []) as MotherCandidate[];

  return (
    <>
      <PageHeader
        title={small ? t("goats.addTitle") : t("cattle.addTitle")}
        description={small ? t("goats.newDesc") : t("cattle.newDesc")}
        action={<ButtonLink href={back} variant="secondary">{t("common.back")}</ButtonLink>}
      />
      <Card className="max-w-2xl">
        <LimitNotice
          t={t}
          kind={limitKey}
          state={states[limitKey]}
          used={usage[limitKey]}
          max={limits[limitKey]}
          plan={planName(plan, locale)}
          canUpgrade={MANAGERS.includes(role)}
        />
        {!atLimit && (
          <ActionForm action={addCattle} submitLabel={t("cattle.addSubmit")} successHref={back}>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("cattle.tag")}>
                <Input name="tag_number" required />
              </Field>
              <Field label={t("common.name")}>
                <Input name="name" />
              </Field>
            </div>
            <Field label={t("common.category")} hint={typeSexHint(i18n, group)}>
              <Select name="category" required options={categoryOptions(i18n, group)} />
            </Field>
            <Field label={t("common.breed")}>
              <Select name="breed" options={breeds} />
            </Field>
            <Field label={t("cattle.dob")}>
              <Input name="date_of_birth" type="date" />
            </Field>
            <ParentsFields candidates={mothers} i18n={i18n} />
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("cattle.purchaseDate")}>
                <Input name="purchase_date" type="date" />
              </Field>
              <Field label={t("cattle.price", { cur: farm.currency })}>
                <Input name="purchase_price" type="number" min="0" step="0.01" />
              </Field>
            </div>
            {fattening && (
              <fieldset className="grid gap-3 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" name="is_fattening" defaultChecked={forFattening} className="mt-0.5 accent-emerald-700" data-testid="is-fattening" />
                  <span>
                    <span className="font-medium text-stone-900">{t("fatten.checkbox")}</span>
                    <span className="block text-xs text-stone-500">{t("fatten.checkboxHint")}</span>
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t("fatten.startWeight")} hint={t("fatten.startWeightHint")}>
                    <Input name="start_weight_kg" type="number" min="1" max="1500" step="0.1" inputMode="decimal" />
                  </Field>
                  <Field label={t("fatten.targetWeight")}>
                    <Input name="target_weight_kg" type="number" min="1" max="1500" step="0.1" inputMode="decimal" />
                  </Field>
                </div>
              </fieldset>
            )}
            <Field label={t("common.notes")}>
              <Textarea name="notes" rows={2} />
            </Field>
          </ActionForm>
        )}
      </Card>
    </>
  );
}
