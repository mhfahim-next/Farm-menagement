import type { I18n } from "@/lib/i18n/core";

type E = I18n["e"];

const opts = (e: E, values: string[]) => values.map((value) => ({ value, label: e(value) }));

export const categoryOptions = (e: E) => opts(e, ["cow", "heifer", "calf", "bull", "steer"]);
export const sexOptions = (e: E) => opts(e, ["female", "male"]);
export const statusOptions = (e: E) => opts(e, ["active", "sold", "dead"]);
