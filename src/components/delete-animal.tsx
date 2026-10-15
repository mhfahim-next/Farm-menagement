"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { ActionState } from "@/lib/types";
import { useI18n } from "./i18n-provider";
import { useToast } from "./toast";
import { Button, Spinner } from "./ui";

/** Confirms, deletes through a server action, shows a toast and returns to `redirectTo`. */
export function DeleteButton({
  action,
  id,
  confirm,
  label,
  redirectTo,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  id: string;
  confirm: string;
  label: string;
  redirectTo: string;
}) {
  const { t } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="danger"
      disabled={pending}
      data-testid="delete-animal"
      onClick={() => {
        if (!window.confirm(confirm)) return;
        const formData = new FormData();
        formData.set("id", id);
        startTransition(async () => {
          const result = await action(null, formData);
          if (result?.error) return toast("error", result.error);
          if (result?.success) toast("success", result.success);
          router.push(redirectTo);
        });
      }}
    >
      {pending && <Spinner className="mr-2" />}
      {pending ? t("common.saving") : label}
    </Button>
  );
}
