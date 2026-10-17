"use client";

import { useRouter } from "next/navigation";
import { Fragment, startTransition, useActionState, type ReactNode } from "react";
import type { ActionState } from "@/lib/types";
import { useI18n } from "./i18n-provider";
import { announceNavigation } from "./nav-progress";
import { useResultToast } from "./toast";
import { Button, Spinner, type ButtonVariant } from "./ui";

export function SubmitButton({
  children,
  variant,
  className,
  pending,
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
  pending: boolean;
}) {
  const { t } = useI18n();
  return (
    <Button type="submit" disabled={pending} variant={variant} className={className}>
      {pending && <Spinner className="mr-2" />}
      {pending ? t("common.saving") : children}
    </Button>
  );
}

type State = (NonNullable<ActionState> & { saves: number }) | null;

/**
 * A form bound to a server action that returns { error } or { success }.
 *
 * It submits through onSubmit rather than the `action` prop on purpose:
 * React 19 resets every field after an action finishes, which would wipe what
 * the user typed when a save is rejected, and leaves controlled fields out of
 * sync. Here the fields are kept on errors and the whole field set is
 * remounted (fresh defaults) only after a successful save.
 */
export function ActionForm({
  action,
  submitLabel = "Save",
  submitVariant,
  className = "grid gap-4",
  fullWidthSubmit = false,
  successHref,
  children,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel?: string;
  submitVariant?: ButtonVariant;
  className?: string;
  fullWidthSubmit?: boolean;
  /** Go here after a successful save (used by the dedicated "add" pages). */
  successHref?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [state, dispatch, pending] = useActionState<State, FormData>(async (prev, formData) => {
    const result = await action(prev, formData);
    // Navigate from here, not an effect: a save can re-render the page so this form unmounts
    // (e.g. the plan limit is now reached) before an effect would run.
    if (result?.success && successHref) {
      announceNavigation();
      router.push(successHref);
    }
    const saves = prev?.saves ?? 0;
    return result ? { ...result, saves: result.success ? saves + 1 : saves } : null;
  }, null);

  useResultToast(state);

  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => dispatch(formData));
      }}
    >
      <Fragment key={state?.saves ?? 0}>{children}</Fragment>
      {!pending && state?.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <div>
        <SubmitButton
          variant={submitVariant}
          pending={pending}
          className={fullWidthSubmit ? "w-full" : undefined}
        >
          {submitLabel}
        </SubmitButton>
      </div>
    </form>
  );
}
