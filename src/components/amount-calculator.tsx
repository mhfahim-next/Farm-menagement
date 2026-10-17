"use client";

import { useState } from "react";
import { useI18n } from "./i18n-provider";
import { Field, Input } from "./ui";

/**
 * Quantity × rate = total. Leave quantity or rate empty to type the total
 * yourself. The saved total is always what the form submits as `amount`.
 */
export function AmountCalculator({ currency }: { currency: string }) {
  const { t, f } = useI18n();
  const [qty, setQty] = useState("");
  const [rate, setRate] = useState("");
  const [manual, setManual] = useState("");

  const q = Number(qty);
  const r = Number(rate);
  const calculated = qty !== "" && rate !== "" && q > 0 && r >= 0;
  const total = calculated ? Math.round(q * r * 100) / 100 : null;

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("finance.quantity")}>
          <Input name="quantity" type="number" min="0.001" step="0.001" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} />
        </Field>
        <Field label={t("finance.rate", { cur: currency })}>
          <Input name="unit_price" type="number" min="0" step="0.01" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} />
        </Field>
      </div>
      <Field
        label={t("finance.amountWith", { cur: currency })}
        hint={calculated ? t("finance.calcHint", { qty: f.number(q, 3), rate: f.number(r, 2) }) : t("finance.manualHint")}
      >
        <Input
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          inputMode="decimal"
          required
          readOnly={calculated}
          value={calculated ? String(total) : manual}
          onChange={(e) => setManual(e.target.value)}
          className={calculated ? "bg-stone-50 font-semibold" : undefined}
        />
      </Field>
    </div>
  );
}
