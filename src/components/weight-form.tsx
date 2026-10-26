"use client";

import { useState } from "react";
import type { ActionState } from "@/lib/types";
import { tapeWeight } from "@/lib/weights";
import { ActionForm } from "./action-form";
import { useI18n } from "./i18n-provider";
import { Field, Input, Select } from "./ui";

/** Add a weighing: from a scale, from a measuring tape (weight is calculated) or an estimate. */
export function WeightForm({
  action,
  cattleId,
  today,
  allowTape = true,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  cattleId: string;
  today: string;
  /** The tape formula is for cattle; goats and sheep use a scale or an estimate. */
  allowTape?: boolean;
}) {
  const { t, f } = useI18n();
  const [method, setMethod] = useState("scale");
  const [girth, setGirth] = useState("");
  const [length, setLength] = useState("");
  const tape = method === "tape" ? tapeWeight(Number(girth), Number(length)) : null;

  return (
    <ActionForm action={action} submitLabel={t("weight.save")} className="grid gap-3">
      <input type="hidden" name="cattle_id" value={cattleId} />
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("common.date")}>
          <Input name="weigh_date" type="date" defaultValue={today} max={today} required />
        </Field>
        <Field label={t("weight.method")}>
          <Select
            name="method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            options={[
              { value: "scale", label: t("weight.methods.scale") },
              ...(allowTape ? [{ value: "tape", label: t("weight.methods.tape") }] : []),
              { value: "estimate", label: t("weight.methods.estimate") },
            ]}
          />
        </Field>
      </div>
      {method === "tape" ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("weight.girth")}>
              <Input name="heart_girth_cm" type="number" min="30" max="400" step="0.5" inputMode="decimal" value={girth} onChange={(e) => setGirth(e.target.value)} required />
            </Field>
            <Field label={t("weight.length")}>
              <Input name="body_length_cm" type="number" min="30" max="400" step="0.5" inputMode="decimal" value={length} onChange={(e) => setLength(e.target.value)} required />
            </Field>
          </div>
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900" aria-live="polite">
            {tape ? t("weight.tapeResult", { kg: f.number(tape, 1) }) : t("weight.tapeHint")}
          </p>
          <input type="hidden" name="weight_kg" value={tape ?? ""} />
        </>
      ) : (
        <Field label={t("weight.kg")}>
          <Input name="weight_kg" type="number" min="1" max="2000" step="0.1" inputMode="decimal" required />
        </Field>
      )}
      <Field label={t("common.notes")}>
        <Input name="notes" maxLength={300} />
      </Field>
    </ActionForm>
  );
}
