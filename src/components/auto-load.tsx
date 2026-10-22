"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input, Select } from "./ui";

/**
 * A date or choice field of a sheet form that also decides which day's data the
 * page shows. It is a real form field (so what you see is what gets saved) and
 * changing it reloads the page for that day or session straight away; there is
 * no separate "Load" button to forget.
 */
export function AutoLoad({
  name,
  param,
  defaultValue,
  max,
  options,
  className,
}: {
  /** Form field name sent to the server action. */
  name: string;
  /** Query-string key the page reads (e.g. "date", "session"). */
  param: string;
  defaultValue: string;
  max?: string;
  /** Given for a choice list; otherwise the field is a date. */
  options?: { value: string; label: string }[];
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const go = (value: string) => {
    if (!value) return;
    const next = new URLSearchParams(search.toString());
    next.set(param, value);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  return options ? (
    <Select name={name} defaultValue={defaultValue} options={options} className={className} onChange={(e) => go(e.target.value)} />
  ) : (
    <Input name={name} type="date" defaultValue={defaultValue} max={max} required className={className} onChange={(e) => go(e.target.value)} />
  );
}
