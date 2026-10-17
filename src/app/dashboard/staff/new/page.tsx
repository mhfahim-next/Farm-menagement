import type { Metadata } from "next";
import { ActionForm } from "@/components/action-form";
import { ButtonLink, Card, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { MANAGERS, requireRole } from "@/lib/auth";
import { today } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { addStaff } from "../actions";
import { moduleChoices } from "../module-choices";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("staff.addTitle") };
}

export default async function NewStaffPage() {
  const { farm } = await requireRole(MANAGERS);
  const { t, options } = await getI18n();
  const modules = moduleChoices(t, farm);

  return (
    <>
      <PageHeader
        title={t("staff.addTitle")}
        description={t("staff.newDesc")}
        action={<ButtonLink href="/dashboard/staff" variant="secondary">{t("common.back")}</ButtonLink>}
      />
      <Card className="max-w-2xl">
        <ActionForm action={addStaff} submitLabel={t("staff.addSubmit")} successHref="/dashboard/staff">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("common.name")}>
              <Input name="name" required />
            </Field>
            <Field label={t("staff.phone")}>
              <Input name="phone" type="tel" inputMode="tel" />
            </Field>
            <Field label={t("staff.position")}>
              <Select name="position" options={[{ value: "", label: "—" }, ...options("staff_position")]} />
            </Field>
            <Field label={t("staff.worksOn")}>
              <Select name="module" defaultValue={modules.at(-1)?.value} options={modules} />
            </Field>
            <Field label={t("staff.salary", { cur: farm.currency })}>
              <Input name="monthly_salary" type="number" min="0" step="0.01" inputMode="decimal" required />
            </Field>
            <Field label={t("staff.joinDate")}>
              <Input name="join_date" type="date" defaultValue={today()} />
            </Field>
          </div>
          <Field label={t("common.notes")}>
            <Textarea name="notes" rows={2} />
          </Field>
        </ActionForm>
      </Card>
    </>
  );
}
