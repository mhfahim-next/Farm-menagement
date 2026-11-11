"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { fieldClass } from "@/components/ui";
import { dmyToIso, isoToDmy, typingDmy } from "@/lib/date-text";

type Props = {
  name?: string;
  /** ISO date (yyyy-mm-dd). Give value + onChange to control it, or defaultValue. */
  value?: string;
  defaultValue?: string;
  onChange?: (iso: string) => void;
  min?: string;
  max?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  "data-testid"?: string;
};

/**
 * A date typed as dd/mm/yyyy (slashes added while typing; Bangla digits work)
 * with a calendar button. The form still sends yyyy-mm-dd under `name`, so
 * server actions and offline saving see the same value as before.
 */
export function DateInput({ name, value, defaultValue, onChange, min, max, required, disabled, className, id, ...rest }: Props) {
  const { t } = useI18n();
  const controlled = value !== undefined;
  const [inner, setInner] = useState(defaultValue ?? "");
  const iso = controlled ? value : inner;
  const [text, setText] = useState(isoToDmy(iso));
  const [shown, setShown] = useState(iso);
  const textRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLInputElement>(null);

  // The date changed from outside (or from the calendar): show it.
  if (iso !== shown) {
    setShown(iso);
    if (dmyToIso(text) !== iso) setText(isoToDmy(iso));
  }

  const commit = (next: string) => {
    setShown(next);
    if (!controlled) setInner(next);
    onChange?.(next);
  };

  // The browser's own check before sending: a readable message for bad or out-of-range dates.
  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const parsed = dmyToIso(text);
    let msg = "";
    if (text && !parsed) msg = t("date.err.format");
    else if (parsed && min && parsed < min) msg = `${t("date.err.min")} (≥ ${isoToDmy(min)})`;
    else if (parsed && max && parsed > max) msg = `${t("date.err.max")} (≤ ${isoToDmy(max)})`;
    el.setCustomValidity(msg);
  }, [text, min, max, t]);

  return (
    <span className="relative block">
      <input
        ref={textRef}
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={t("date.placeholder")}
        value={text}
        required={required}
        disabled={disabled}
        maxLength={10}
        onChange={(e) => {
          const next = typingDmy(e.target.value, text);
          setText(next);
          const parsed = dmyToIso(next);
          if (parsed) commit(parsed);
          else if (!next) commit("");
        }}
        onBlur={() => {
          const parsed = dmyToIso(text);
          if (parsed) setText(isoToDmy(parsed));
        }}
        className={`${fieldClass} pr-11 tabular-nums ${className ?? ""}`}
        data-testid={rest["data-testid"]}
        data-iso={iso}
      />
      {name && <input type="hidden" name={name} value={dmyToIso(text) ?? ""} disabled={disabled} />}
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        aria-label={t("date.pick")}
        title={t("date.pick")}
        onClick={() => {
          const p = pickerRef.current;
          if (!p) return;
          try {
            p.showPicker();
          } catch {
            p.focus();
            p.click();
          }
        }}
        className="absolute inset-y-0 right-0 grid w-10 place-items-center rounded-r-lg text-stone-500 hover:text-emerald-700 disabled:opacity-50"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
          <path d="M3.5 9.5h17M8 3v4M16 3v4" strokeLinecap="round" />
        </svg>
      </button>
      {/* The phone's own calendar, opened by the button; it holds no name, so it is never sent. */}
      <input
        ref={pickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden
        value={dmyToIso(text) ?? ""}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => {
          setText(isoToDmy(e.target.value));
          commit(e.target.value);
        }}
        className="pointer-events-none absolute bottom-0 right-0 h-px w-px opacity-0"
      />
    </span>
  );
}
