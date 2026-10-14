import type { I18n } from "@/lib/i18n/core";

// Small helpers for reading FormData in server actions.

export function str(fd: FormData, key: string) {
  const v = fd.get(key);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}

export function num(fd: FormData, key: string) {
  const v = str(fd, key);
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function int(fd: FormData, key: string) {
  const n = num(fd, key);
  return n === null ? null : Math.trunc(n);
}

/** Turns Postgres errors into messages a farmer can act on. */
export function dbError(t: I18n["t"], error: { code?: string; message: string }) {
  if (error.code === "23505") return t("common.dbDuplicate");
  if (error.code === "23514") return t("common.dbRange");
  if (error.code === "42501") return t("common.dbForbidden");
  return error.message;
}
