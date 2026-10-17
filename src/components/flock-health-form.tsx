"use client";

import { useState } from "react";
import { nextDue } from "@/lib/health";
import type { ActionState, FlockHealthRecord, HealthRecordType } from "@/lib/types";
import { ActionForm } from "./action-form";
import { useI18n } from "./i18n-provider";
import { Field, Input, Select } from "./ui";

export type PickerFlock = { id: string; label: string };

/** Record a vaccine / medicine / pest control for one or more layer flocks. */
export function FlockHealthForm({
  action,
  today,
  currency,
  flocks,
  flockId,
  record,
  successHref,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  today: string;
  currency: string;
  flocks?: PickerFlock[];
  flockId?: string;
  /** Edit mode: an existing record to change. */
  record?: FlockHealthRecord;
  successHref?: string;
}) {
  const { t, f, options } = useI18n();
  const presets = options("flock_health_preset");
  const [type, setType] = useState<HealthRecordType>(record?.record_type ?? "vaccination");
  const [product, setProduct] = useState(record?.product ?? "");
  const [interval, setInterval] = useState(record?.interval_days ? String(record.interval_days) : "");
  const [date, setDate] = useState(record?.record_date ?? today);
  const [picked, setPicked] = useState<Set<string>>(new Set(flocks?.length === 1 ? [flocks[0].id] : []));

  const due = nextDue(date, Number(interval) || null);

  function applyPreset(id: string) {
    const p = presets.find((x) => x.value === id);
    if (!p) return;
    if (p.meta.record_type) setType(p.meta.record_type as HealthRecordType);
    setProduct(p.meta.product ?? p.label);
    setInterval(p.meta.interval_days && p.meta.interval_days > 0 ? String(p.meta.interval_days) : "");
  }

  return (
    <ActionForm
      action={action}
      submitLabel={record ? t("cattle.saveChanges") : t("flockHealth.submit")}
      className="grid gap-4"
      successHref={successHref}
    >
      {flockId && <input type="hidden" name="flock_id" value={flockId} />}
      {record && <input type="hidden" name="id" value={record.id} />}

      {flocks && (
        <fieldset className="grid gap-2">
          <legend className="mb-1 text-sm font-medium text-stone-700">{t("flockHealth.flocks")}</legend>
          <div className="grid gap-1 rounded-lg border border-stone-200 p-2 sm:grid-cols-2">
            {flocks.map((fl) => (
              <label key={fl.id} className="flex items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-stone-50">
                <input
                  type="checkbox"
                  name="flock_id"
                  value={fl.id}
                  checked={picked.has(fl.id)}
                  onChange={(e) => {
                    const next = new Set(picked);
                    if (e.target.checked) next.add(fl.id);
                    else next.delete(fl.id);
                    setPicked(next);
                  }}
                  className="accent-emerald-700"
                />
                <span className="truncate">{fl.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {!record && (
        <Field label={t("health.quickPick")}>
          <select
            defaultValue=""
            onChange={(ev) => applyPreset(ev.target.value)}
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">{t("health.quickPickPlaceholder")}</option>
            {presets.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </Field>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label={t("common.type")}>
          <Select name="record_type" value={type} onChange={(ev) => setType(ev.target.value as HealthRecordType)} options={options("health_type")} />
        </Field>
        <Field label={t("health.dateGiven")}>
          <Input name="record_date" type="date" value={date} max={today} onChange={(ev) => setDate(ev.target.value)} required />
        </Field>
      </div>

      <Field label={t("health.product")}>
        <Input name="product" value={product} onChange={(ev) => setProduct(ev.target.value)} placeholder={t("health.productPlaceholder")} required />
      </Field>

      <Field label={t("health.repeatEvery")} hint={due ? t("health.nextDueOn", { date: f.date(due) }) : t("health.oneTimeHint")}>
        <Input name="interval_days" type="number" min="1" inputMode="numeric" value={interval} onChange={(ev) => setInterval(ev.target.value)} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t("health.dose")}>
          <Input name="dose" defaultValue={record?.dose ?? ""} placeholder={t("flockHealth.dosePlaceholder")} />
        </Field>
        <Field label={t("health.batch")}>
          <Input name="batch_number" defaultValue={record?.batch_number ?? ""} />
        </Field>
        <Field label={t("health.givenBy")}>
          <Input name="vet_name" defaultValue={record?.vet_name ?? ""} />
        </Field>
        <Field label={t("flockHealth.costPerFlock", { cur: currency })}>
          <Input name="cost" type="number" min="0" step="0.01" inputMode="decimal" defaultValue={record?.cost ?? ""} />
        </Field>
      </div>

      {(type === "treatment" || type === "parasite_control") && (
        <Field label={t("flockHealth.withdrawalUntil")} hint={t("flockHealth.withdrawalHint")}>
          <Input name="withdrawal_until" type="date" defaultValue={record?.withdrawal_until ?? ""} />
        </Field>
      )}

      <Field label={t("common.notes")}>
        <Input name="notes" defaultValue={record?.notes ?? ""} placeholder={t("health.notesPlaceholder")} />
      </Field>
    </ActionForm>
  );
}
