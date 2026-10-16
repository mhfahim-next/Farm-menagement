"use client";

import { useRef, useState } from "react";
import type { ActionState, BreedingEvent } from "@/lib/types";
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
  checkDays,
  record,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  today: string;
  currency: string;
  cows?: { id: string; label: string }[];
  cattleId?: string;
  defaultType?: string;
  checkDays: number;
  /** Edit mode: an existing event to change (its type cannot be changed). */
  record?: BreedingEvent;
}) {
  const { t, options } = useI18n();
  const [type, setType] = useState(record?.event_type ?? defaultType);
  const timeInput = useRef<HTMLInputElement>(null);
  // A newborn is usually a female non-milking type (heifer) by default.
  const calfTypes = options("cattle_category");
  const defaultCalfType =
    calfTypes.find((c) => c.meta.sex === "female" && !c.meta.milking)?.value ?? calfTypes[0]?.value ?? "";

  return (
    <ActionForm action={action} submitLabel={record ? t("cattle.saveChanges") : t("breeding.submit")} className="grid gap-4">
      {record && <input type="hidden" name="id" value={record.id} />}
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
        <Field label={t("breeding.whatHappened")} className="col-span-2">
          <Select
            name="event_type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            disabled={!!record}
            options={options("breeding_event")}
          />
          {record && <input type="hidden" name="event_type" value={record.event_type} />}
        </Field>
        <Field label={t("common.date")}>
          <Input name="event_date" type="date" defaultValue={record?.event_date ?? today} max={today} required />
        </Field>
        <Field label={t("breeding.time")}>
          <span className="flex gap-2">
            <Input ref={timeInput} name="event_time" type="time" defaultValue={record?.event_time?.slice(0, 5) ?? ""} />
            <button
              type="button"
              className="shrink-0 rounded-lg border border-stone-300 px-3 text-sm text-stone-700 hover:bg-stone-50"
              onClick={() => {
                const d = new Date();
                if (timeInput.current) timeInput.current.value = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
              }}
            >
              {t("breeding.timeNow")}
            </button>
          </span>
        </Field>
      </div>

      {type === "heat" && (
        <fieldset className="grid gap-1.5">
          <legend className="mb-1 text-sm font-medium text-stone-700">{t("breeding.signsSeen")}</legend>
          {options("heat_sign").map((s) => (
            <label key={s.value} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="heat_sign"
                value={s.value}
                defaultChecked={!!record?.heat_signs?.split(",").map((x) => x.trim()).includes(s.value)}
                className="accent-emerald-700"
              />
              {s.label}
            </label>
          ))}
        </fieldset>
      )}

      {type === "insemination" && (
        <>
          <Field label={t("breeding.bullSemen")}>
            <Input name="bull_or_semen" defaultValue={record?.bull_or_semen ?? ""} placeholder={t("breeding.bullSemenPlaceholder")} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("breeding.technician")}>
              <Input name="technician" defaultValue={record?.technician ?? ""} />
            </Field>
            <Field label={t("breeding.cost", { cur: currency })}>
              <Input name="cost" type="number" min="0" step="0.01" inputMode="decimal" defaultValue={record?.cost ?? ""} />
            </Field>
          </div>
          {record ? (
            <Field label={t("breeding.expectedCalving")} hint={t("breeding.expectedCalvingHint")}>
              <Input name="expected_calving_date" type="date" defaultValue={record.expected_calving_date ?? ""} />
            </Field>
          ) : (
            <p className="rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-600">{t("breeding.aiHint", { days: checkDays })}</p>
          )}
        </>
      )}

      {type === "pregnancy_check" && (
        <>
          <Field label={t("breeding.result")}>
            <Select
              name="result"
              required
              defaultValue={record?.result ?? ""}
              options={[{ value: "", label: t("breeding.chooseResult") }, ...options("pregnancy_result")]}
            />
          </Field>
          <Field label={t("breeding.checkedBy")}>
            <Input name="technician" defaultValue={record?.technician ?? ""} placeholder={t("breeding.checkedByPlaceholder")} />
          </Field>
        </>
      )}

      {type === "calving" && !record && (
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
        <Textarea name="notes" rows={2} defaultValue={record?.notes ?? ""} />
      </Field>
    </ActionForm>
  );
}
