"use client";

import { useState } from "react";
import { healthPresets, healthTypeOptions, nextDue } from "@/lib/health";
import type { ActionState, HealthRecordType } from "@/lib/types";
import { ActionForm } from "./action-form";
import { useI18n } from "./i18n-provider";
import { Field, Input, Select } from "./ui";

export type PickerAnimal = { id: string; label: string; category: string };

function AnimalPicker({ animals }: { animals: PickerAnimal[] }) {
  const { t } = useI18n();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const set = (ids: string[]) => setSelected(new Set(ids));
  const chip = "rounded border border-stone-300 px-2 py-1 hover:bg-stone-50";

  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1 text-sm font-medium text-stone-700">
        {t("health.animals")}{" "}
        <span className="font-normal text-stone-500">{t("health.selectedCount", { n: selected.size })}</span>
      </legend>
      <div className="flex flex-wrap gap-2 text-xs">
        <button type="button" className={chip} onClick={() => set(animals.map((a) => a.id))}>
          {t("health.selectAll")}
        </button>
        <button type="button" className={chip} onClick={() => set(animals.filter((a) => a.category === "cow").map((a) => a.id))}>
          {t("health.cowsOnly")}
        </button>
        <button type="button" className={chip} onClick={() => set([])}>
          {t("health.clear")}
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
  const { t, e, f } = useI18n();
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
    <ActionForm action={action} submitLabel={t("health.submit")} className="grid gap-4">
      {cattleId && <input type="hidden" name="cattle_id" value={cattleId} />}
      {animals && <AnimalPicker animals={animals} />}

      <Field label={t("health.quickPick")}>
        <select
          defaultValue=""
          onChange={(ev) => applyPreset(ev.target.value)}
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">{t("health.quickPickPlaceholder")}</option>
          {healthPresets.map((p) => (
            <option key={p.id} value={p.id}>
              {t(`preset.${p.id}` as "preset.fmd")}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t("common.type")}>
          <Select
            name="record_type"
            value={type}
            onChange={(ev) => setType(ev.target.value as HealthRecordType)}
            options={healthTypeOptions(e)}
          />
        </Field>
        <Field label={t("health.dateGiven")}>
          <Input name="record_date" type="date" value={date} max={today} onChange={(ev) => setDate(ev.target.value)} required />
        </Field>
      </div>

      <Field label={t("health.product")}>
        <Input name="product" value={product} onChange={(ev) => setProduct(ev.target.value)} placeholder={t("health.productPlaceholder")} required />
      </Field>

      <Field
        label={t("health.repeatEvery")}
        hint={due ? t("health.nextDueOn", { date: f.date(due) }) : t("health.oneTimeHint")}
      >
        <Input name="interval_days" type="number" min="1" inputMode="numeric" value={interval} onChange={(ev) => setInterval(ev.target.value)} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t("health.dose")}>
          <Input name="dose" placeholder={t("health.dosePlaceholder")} />
        </Field>
        <Field label={t("health.batch")}>
          <Input name="batch_number" />
        </Field>
        <Field label={t("health.givenBy")}>
          <Input name="vet_name" />
        </Field>
        <Field label={t("health.costPerAnimal", { cur: currency })}>
          <Input name="cost" type="number" min="0" step="0.01" inputMode="decimal" />
        </Field>
      </div>

      {(type === "treatment" || type === "parasite_control") && (
        <Field label={t("health.withdrawalUntil")} hint={t("health.withdrawalHint")}>
          <Input name="withdrawal_until" type="date" />
        </Field>
      )}

      <Field label={t("common.notes")}>
        <Input name="description" placeholder={t("health.notesPlaceholder")} />
      </Field>
    </ActionForm>
  );
}
