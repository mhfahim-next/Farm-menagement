"use client";

import { useState, useTransition } from "react";
import { resolveRequest } from "@/app/admin/actions";
import { useI18n } from "./i18n-provider";
import { useToast } from "./toast";
import { Button, Spinner, Textarea } from "./ui";

/** Reply box + Approve / Decline (upgrade) or Mark answered (support) for the admin inbox. */
export function RequestResolver({
  id,
  kind,
  confirmApprove,
}: {
  id: string;
  kind: "upgrade" | "support";
  confirmApprove: string;
}) {
  const { t } = useI18n();
  const [reply, setReply] = useState("");
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  function run(approve: boolean) {
    if (kind === "upgrade" && approve && !window.confirm(confirmApprove)) return;
    startTransition(async () => {
      const result = await resolveRequest(id, approve, reply);
      if (result?.error) toast("error", result.error);
      else if (result?.success) toast("success", result.success);
    });
  }

  return (
    <div className="mt-3 grid gap-2">
      <Textarea
        rows={2}
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        placeholder={t("admin.requests.reply")}
        maxLength={2000}
        aria-label={t("admin.requests.reply")}
      />
      <div className="flex flex-wrap items-center gap-2">
        {pending && <Spinner className="text-emerald-700" />}
        {kind === "upgrade" ? (
          <>
            <Button type="button" disabled={pending} onClick={() => run(true)} data-testid="approve-request">
              {t("admin.requests.approve")}
            </Button>
            <Button type="button" variant="secondary" disabled={pending} onClick={() => run(false)} data-testid="reject-request">
              {t("admin.requests.reject")}
            </Button>
          </>
        ) : (
          <Button type="button" disabled={pending} onClick={() => run(true)} data-testid="resolve-request">
            {t("admin.requests.resolve")}
          </Button>
        )}
      </div>
    </div>
  );
}
