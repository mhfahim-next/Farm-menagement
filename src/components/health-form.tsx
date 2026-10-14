"use client";

import { useState } from "react";
import { healthPresets, healthTypeOptions, nextDue } from "@/lib/health";
import type { ActionState, HealthRecordType } from "@/lib/types";
import { ActionForm } from "./action-form";
import { Field, Input, Select } from "./ui";

export type PickerAnimal = { id: string; label: string; category: string };

function AnimalPicker({ animals }: { animals: PickerAnimal[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const set = (ids: string[]) => setSelected(new Set(ids));

  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1 text-sm font-medium text-stone-700">
        Animals <span className="font-normal text-stone-500">({selected.size} selected)</span>
      </legend>
      <div className="flex flex-wrap gap-2 text-xs">
        <button type="button" className="rounded border border-stone-300 px-2 py-1 hover:bg-stone-50" onClick={() => set(animals.map((a) => a.id))}>
          Select all
        </button>
        <button type="button" className="rounded border border-stone-300 px-2 py-1 hover:bg-stone-50" onClick={() => set(animals.filter((a) => a.category === "cow").map((a) => a.id))}>
          Cows only
        </button>
        <button type="button" className="rounded border border-stone-300 px-2 py-1 hover:bg-stone-50" onClick={() => set([])}>
          Clear
        </button>
      </div>
      <div className="grid max-h-56 grid-cols-2 gap-1 overflow-y-auto rounded-lg border border-stone-200 p-2">
        {animals.map((a) => (
          <label key={a.id} className="flex items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-stone-50">
            <input
              type="checkbox"
              name="cattle_id"
              value={a.id}
              checked={selected.has(a.id)}
              onChange={(e) => {
                const next = new Set(selected);
                if (e.target.checked) next.add(a.id);
                else next.delete(a.id);
                setSelected(next);
              }}
              className="accent-emerald-700"
            />
            <span className="truncate">{a.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Record a vaccine / pesticide / treatment. Pass `animals` for the herd-wide
 * picker, or `cattleId` to record for a single animal.
 */
export function HealthForm({
  action,
  today,
  currency,
  animals,
  cattleId,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  today: string;
  currency: string;
  animals?: PickerAnimal[];
  cattleId?: string;
}) {
  const [type, setType] = useState<HealthRecordType>("vaccination");
  const [product, setProduct] = useState("");
  const [interval, setInterval] = useState("");
  const [date, setDate] = useState(today);

  const due = nextDue(date, Number(interval) || null);

  function applyPreset(id: string) {
    const p = healthPresets.find((x) => x.id === id);
    if (!p) return;
    setType(p.type);
    setProduct(p.product);
    setInterval(p.intervalDays > 0 ? String(p.intervalDays) : "");
  }

  return (
    <ActionForm action={action} submitLabel="Save record" className="grid gap-4">
      {cattleId && <input type="hidden" name="cattle_id" value={cattleId} />}
      {animals && <AnimalPicker animals={animals} />}

      <Field label="Quick pick">
        <select
          defaultValue=""
          onChange={(e) => applyPreset(e.target.value)}
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">Choose a common vaccine or treatment…</option>
          {healthPresets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Type">
          <Select
            name="record_type"
            value={type}
            onChange={(e) => setType(e.target.value as HealthRecordType)}
            options={healthTypeOptions}
          />
        </Field>
        <Field label="Date given">
          <Input name="record_date" type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} required />
        </Field>
      </div>

      <Field label="Vaccine / product name">
        <Input name="product" value={product} onChange={(e) => setProduct(e.target.value)} placeholder="e.g. FMD, Ivermectin, Butox" required />
      </Field>

      <Field
        label="Repeat every (days)"
        hint={due ? `Next due ${due}` : "Leave empty if it is a one-time treatment."}
      >
        <Input name="interval_days" type="number" min="1" inputMode="numeric" value={interval} onChange={(e) => setInterval(e.target.value)} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Dose">
          <Input name="dose" placeholder="e.g. 2 ml" />
        </Field>
        <Field label="Batch no.">
          <Input name="batch_number" />
        </Field>
        <Field label="Given by (vet / staff)">
          <Input name="vet_name" />
        </Field>
        <Field label={`Cost per animal (${currency})`}>
          <Input name="cost" type="number" min="0" step="0.01" inputMode="decimal" />
        </Field>
      </div>

      {(type === "treatment" || type === "parasite_control") && (
        <Field label="Milk withdrawal until" hint="Don't sell milk before this date.">
          <Input name="withdrawal_until" type="date" />
        </Field>
      )}

      <Field label="Notes">
        <Input name="description" placeholder="Optional details" />
      </Field>
    </ActionForm>
  );
}
