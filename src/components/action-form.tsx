"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/types";
import { Button, type ButtonVariant } from "./ui";

export function SubmitButton({
  children,
  variant,
  className,
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} variant={variant} className={className}>
      {pending ? "Saving…" : children}
    </Button>
  );
}

/**
 * A form bound to a server action that returns { error } or { success }.
 * The action's message is shown under the fields.
 */
export function ActionForm({
  action,
  submitLabel = "Save",
  submitVariant,
  className = "grid gap-4",
  fullWidthSubmit = false,
  children,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel?: string;
  submitVariant?: ButtonVariant;
  className?: string;
  fullWidthSubmit?: boolean;
  children: ReactNode;
}) {
  const [state, formAction] = useActionState(action, null);

  return (
    <form action={formAction} className={className}>
      {children}
      {state?.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {state.success}
        </p>
      )}
      <div>
        <SubmitButton
          variant={submitVariant}
          className={fullWidthSubmit ? "w-full" : undefined}
        >{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
