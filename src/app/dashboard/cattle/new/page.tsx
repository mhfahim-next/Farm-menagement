import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { LimitNotice } from "@/components/limit-notice";
import { ParentsFields } from "@/components/parents-fields";
import { ButtonLink, Card, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { MANAGERS, requireFarm } from "@/lib/auth";
import { breedOptions, typeSexHint, type MotherCandidate } from "@/lib/cattle";
import { getI18n } from "@/lib/i18n/server";
import { planName } from "@/lib/plan-utils";
import { getPlanContext } from "@/lib/plans";
import { addCattle } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("cattle.addTitle") };
}

export default async function NewCattlePage() {
  const { supabase, farm, role } = await requireFarm();
  if (!farm.has_dairy) notFound();
  if (role === "vet") redirect("/dashboard/cattle");
  const i18n = await getI18n();
  const { t, options, locale } = i18n;
  const { plan, usage, limits, states } = await getPlanContext();
  const atLimit = states.cattle === "full" || states.cattle === "over";

  // Every female on the farm can be picked as a mother (even if sold or dead).
  const { data } = await supabase
    .from("cattle")
    .select("id, tag_number, name, category, status")
    .eq("farm_id", farm.id)
    .eq("sex", "female")
    .is("deleted_at", null)
    .order("tag_number");
  const mothers = (data ?? []) as MotherCandidate[];

  return (
    <>
      <PageHeader
        title={t("cattle.addTitle")}
        description={t("cattle.newDesc")}
        action={<ButtonLink href="/dashboard/cattle" variant="secondary">{t("common.back")}</ButtonLink>}
      />
      <Card className="max-w-2xl">
        <LimitNotice
          t={t}
          kind="cattle"
          state={states.cattle}
          used={usage.cattle}
          max={limits.cattle}
          plan={planName(plan, locale)}
          canUpgrade={MANAGERS.includes(role)}
        />
        {!atLimit && (
          <ActionForm action={addCattle} submitLabel={t("cattle.addSubmit")} successHref="/dashboard/cattle">
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("cattle.tag")}>
                <Input name="tag_number" required />
              </Field>
              <Field label={t("common.name")}>
                <Input name="name" />
              </Field>
            </div>
            <Field label={t("common.category")} hint={typeSexHint(i18n)}>
              <Select name="category" required options={options("cattle_category")} />
            </Field>
            <Field label={t("common.breed")}>
              <Select name="breed" options={breedOptions(i18n, "cattle_breed")} />
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
            <Field label={t("common.notes")}>
              <Textarea name="notes" rows={2} />
            </Field>
          </ActionForm>
        )}
      </Card>
    </>
  );
}
