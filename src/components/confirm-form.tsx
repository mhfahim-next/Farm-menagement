"use client";

import { useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";
import type { ActionState } from "@/lib/types";
import { useI18n } from "./i18n-provider";
import { useToast } from "./toast";
import { Button, Spinner, type ButtonVariant } from "./ui";

/**
 * A small inline form for admin row actions. Asks for confirmation first
 * (when `confirm` is given), then runs the server action and shows the result as a toast.
 */
export function ConfirmForm({
  action,
  fields,
  confirm,
  label,
  variant = "secondary",
  successHref,
  children,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  fields: Record<string, string>;
  confirm?: string;
  label: string;
  variant?: ButtonVariant;
  /** Go here after the action succeeds (e.g. away from a page whose record was just deleted). */
  successHref?: string;
  children?: ReactNode;
}) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  return (
    <form
      className="inline-flex flex-col items-start gap-1"
      onSubmit={(e) => {
        e.preventDefault();
        if (confirm && !window.confirm(confirm)) return;
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
          const result = await action(null, formData);
          if (result?.error) toast("error", result.error);
          else if (result?.success) {
            toast("success", result.success);
            if (successHref) router.push(successHref);
          }
        });
      }}
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <span className="inline-flex items-center gap-1.5">
        {children}
        <Button type="submit" variant={variant} disabled={pending} className="px-2.5 py-1 text-xs">
          {pending && <Spinner className="mr-1" />}
          {pending ? t("common.saving") : label}
        </Button>
      </span>
    </form>
  );
}
