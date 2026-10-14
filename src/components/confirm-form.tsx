"use client";

import { useState, useTransition, type ReactNode } from "react";
import type { ActionState } from "@/lib/types";
import { useI18n } from "./i18n-provider";
import { Button, type ButtonVariant } from "./ui";

/**
 * A small inline form for admin row actions. Asks for confirmation first
 * (when `confirm` is given), then runs the server action and shows any error
 * under the button instead of navigating away.
 */
export function ConfirmForm({
  action,
  fields,
  confirm,
  label,
  variant = "secondary",
  children,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  fields: Record<string, string>;
  confirm?: string;
  label: string;
  variant?: ButtonVariant;
  children?: ReactNode;
}) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="inline-flex flex-col items-start gap-1"
      onSubmit={(e) => {
        e.preventDefault();
        if (confirm && !window.confirm(confirm)) return;
        const formData = new FormData(e.currentTarget);
        setError(null);
        startTransition(async () => {
          const result = await action(null, formData);
          if (result?.error) setError(result.error);
        });
      }}
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <span className="inline-flex items-center gap-1.5">
        {children}
        <Button type="submit" variant={variant} disabled={pending} className="px-2.5 py-1 text-xs">
          {pending ? t("common.saving") : label}
        </Button>
      </span>
      {error && (
        <span role="alert" className="max-w-56 text-xs text-red-600">
          {error}
        </span>
      )}
    </form>
  );
}
