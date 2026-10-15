"use client";

import { useState } from "react";
import type { ActionState } from "@/lib/types";
import { ActionForm } from "./action-form";
import { useI18n } from "./i18n-provider";
import { Field, Input, Select, Textarea } from "./ui";


export function BreedingForm({
  action,
  today,
  currency,
  cows,
  cattleId,
  defaultType = "heat",
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  today: string;
  currency: string;
  cows?: { id: string; label: string }[];
  cattleId?: string;
  defaultType?: string;
}) {
  const { t, options } = useI18n();
  const [type, setType] = useState(defaultType);
  // A newborn is usually a female non-milking type (heifer) by default.
  const calfTypes = options("cattle_category");
  const defaultCalfType =
    calfTypes.find((c) => c.meta.sex === "female" && !c.meta.milking)?.value ?? calfTypes[0]?.value ?? "";

  return (
    <ActionForm action={action} submitLabel={t("breeding.submit")} className="grid gap-4">
      {cattleId ? (
        <input type="hidden" name="cattle_id" value={cattleId} />
      ) : (
        <Field label={t("breeding.cow")}>
          <Select
            name="cattle_id"
            required
            defaultValue=""
            options={[
              { value: "", label: t("breeding.chooseCowPlaceholder") },
              ...(cows ?? []).map((c) => ({ value: c.id, label: c.label })),
            ]}
          />
        </Field>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label={t("breeding.whatHappened")}>
          <Select
            name="event_type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            options={options("breeding_event")}
          />
        </Field>
        <Field label={t("common.date")}>
          <Input name="event_date" type="date" defaultValue={today} max={today} required />
        </Field>
      </div>

      {type === "heat" && (
        <fieldset className="grid gap-1.5">
          <legend className="mb-1 text-sm font-medium text-stone-700">{t("breeding.signsSeen")}</legend>
          {options("heat_sign").map((s) => (
            <label key={s.value} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="heat_sign" value={s.value} className="accent-emerald-700" />
              {s.label}
            </label>
          ))}
        </fieldset>
      )}

      {type === "insemination" && (
        <>
          <Field label={t("breeding.bullSemen")}>
            <Input name="bull_or_semen" placeholder={t("breeding.bullSemenPlaceholder")} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("breeding.technician")}>
              <Input name="technician" />
            </Field>
            <Field label={t("breeding.cost", { cur: currency })}>
              <Input name="cost" type="number" min="0" step="0.01" inputMode="decimal" />
            </Field>
          </div>
          <p className="rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-600">{t("breeding.aiHint")}</p>
        </>
      )}

      {type === "pregnancy_check" && (
        <>
          <Field label={t("breeding.result")}>
            <Select
              name="result"
              required
              defaultValue=""
              options={[{ value: "", label: t("breeding.chooseResult") }, ...options("pregnancy_result")]}
            />
          </Field>
          <Field label={t("breeding.checkedBy")}>
            <Input name="technician" placeholder={t("breeding.checkedByPlaceholder")} />
          </Field>
        </>
      )}

      {type === "calving" && (
        <fieldset className="grid gap-3 rounded-lg border border-stone-200 p-3">
          <legend className="px-1 text-sm font-medium text-stone-700">{t("breeding.calfLegend")}</legend>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("breeding.calfTag")} hint={t("breeding.calfTagHint")}>
              <Input name="calf_tag" />
            </Field>
            <Field label={t("breeding.calfType")}>
              <Select name="calf_category" defaultValue={defaultCalfType} options={calfTypes} />
            </Field>
          </div>
          <Field label={t("breeding.calfName")}>
            <Input name="calf_name" />
          </Field>
        </fieldset>
      )}

      {type === "dry_off" && (
        <p className="rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-600">{t("breeding.dryOffHint")}</p>
      )}

      <Field label={t("common.notes")}>
        <Textarea name="notes" rows={2} />
      </Field>
    </ActionForm>
  );
}
