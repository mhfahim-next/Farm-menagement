"use client";

import { useState } from "react";
import type { ActionState } from "@/lib/types";
import { ActionForm } from "./action-form";
import { Field, Input, Select, Textarea } from "./ui";

const eventOptions = [
  { value: "heat", label: "Heat observed" },
  { value: "insemination", label: "Artificial insemination / service" },
  { value: "pregnancy_check", label: "Pregnancy check" },
  { value: "calving", label: "Calving" },
  { value: "dry_off", label: "Dry off" },
];

const heatSigns = [
  "Standing to be mounted",
  "Mounting others",
  "Mucus discharge",
  "Restless / bellowing",
  "Swollen vulva",
  "Drop in milk",
];

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
  const [type, setType] = useState(defaultType);

  return (
    <ActionForm action={action} submitLabel="Save" className="grid gap-4">
      {cattleId ? (
        <input type="hidden" name="cattle_id" value={cattleId} />
      ) : (
        <Field label="Cow">
          <Select
            name="cattle_id"
            required
            defaultValue=""
            options={[{ value: "", label: "Choose a cow…" }, ...(cows ?? []).map((c) => ({ value: c.id, label: c.label }))]}
          />
        </Field>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="What happened">
          <Select name="event_type" value={type} onChange={(e) => setType(e.target.value)} options={eventOptions} />
        </Field>
        <Field label="Date">
          <Input name="event_date" type="date" defaultValue={today} max={today} required />
        </Field>
      </div>

      {type === "heat" && (
        <fieldset className="grid gap-1.5">
          <legend className="mb-1 text-sm font-medium text-stone-700">Signs seen</legend>
          {heatSigns.map((s) => (
            <label key={s} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="heat_sign" value={s} className="accent-emerald-700" />
              {s}
            </label>
          ))}
        </fieldset>
      )}

      {type === "insemination" && (
        <>
          <Field label="Bull / semen">
            <Input name="bull_or_semen" placeholder="Bull name or straw number" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="AI technician">
              <Input name="technician" />
            </Field>
            <Field label={`Cost (${currency})`}>
              <Input name="cost" type="number" min="0" step="0.01" inputMode="decimal" />
            </Field>
          </div>
          <p className="rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-600">
            Expected calving is set to 283 days after insemination. Check for pregnancy after about 45 days.
          </p>
        </>
      )}

      {type === "pregnancy_check" && (
        <>
          <Field label="Result">
            <Select
              name="result"
              required
              defaultValue=""
              options={[
                { value: "", label: "Choose…" },
                { value: "positive", label: "Pregnant" },
                { value: "negative", label: "Not pregnant (open)" },
                { value: "uncertain", label: "Uncertain — recheck" },
              ]}
            />
          </Field>
          <Field label="Checked by">
            <Input name="technician" placeholder="Vet / technician" />
          </Field>
        </>
      )}

      {type === "calving" && (
        <fieldset className="grid gap-3 rounded-lg border border-stone-200 p-3">
          <legend className="px-1 text-sm font-medium text-stone-700">Calf (optional)</legend>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Calf tag no." hint="Adds the calf to your herd.">
              <Input name="calf_tag" />
            </Field>
            <Field label="Sex">
              <Select
                name="calf_sex"
                options={[
                  { value: "female", label: "Female" },
                  { value: "male", label: "Male" },
                ]}
              />
            </Field>
          </div>
          <Field label="Calf name">
            <Input name="calf_name" />
          </Field>
        </fieldset>
      )}

      {type === "dry_off" && (
        <p className="rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-600">
          Stop milking this cow ahead of calving to let her udder rest.
        </p>
      )}

      <Field label="Notes">
        <Textarea name="notes" rows={2} />
      </Field>
    </ActionForm>
  );
}
