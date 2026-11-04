"use client";

import { useSyncExternalStore } from "react";
import { useI18n } from "./i18n-provider";

const noop = () => () => {};
const readDue = () => {
  const v = new URLSearchParams(window.location.search).get("requested");
  return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
};

/** After a deletion request (…/delete-account?requested=2026-12-01): "Your account will be deleted on …". */
export function DeleteRequested() {
  const { t, f } = useI18n();
  const due = useSyncExternalStore(noop, readDue, () => null);
  if (!due) return null;
  return (
    <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-medium text-emerald-900" role="status" data-testid="delete-requested">
      {t("del.requested", { date: f.date(due) })}
    </p>
  );
}
