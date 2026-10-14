// Admin-managed dropdowns (see supabase/migrations/*_dropdown_options.sql).

export const LIST_KEYS = [
  "cattle_category",
  "cattle_status",
  "milk_session",
  "health_type",
  "health_preset",
  "breeding_event",
  "pregnancy_result",
  "heat_sign",
  "flock_status",
  "txn_type",
  "txn_module",
  "finance_category",
  "currency",
] as const;

export type ListKey = (typeof LIST_KEYS)[number];

export function isListKey(value: unknown): value is ListKey {
  return typeof value === "string" && (LIST_KEYS as readonly string[]).includes(value);
}

export type OptionMeta = {
  sex?: "female" | "male";
  milking?: boolean;
  txn_type?: "income" | "expense";
  record_type?: string;
  product?: string;
  interval_days?: number;
};

export type OptionRow = {
  list_key: ListKey;
  value: string;
  label_en: string;
  label_bn: string | null;
  sort_order: number;
  active: boolean;
  can_hide: boolean;
  meta: OptionMeta;
};

export type ListInfo = { key: ListKey; editable: boolean; sort_order: number };
