"use client";

import { useState, useTransition } from "react";
import { approveEntry, rejectEntry } from "@/app/dashboard/approvals/actions";
import { useI18n } from "./i18n-provider";
import { useToast } from "./toast";
import { Button, Spinner, Textarea } from "./ui";

/** Approve or reject (with an optional reason) one entry a doctor submitted. */
export function ApprovalButtons({ id }: { id: string }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");

  function run(kind: "approve" | "reject") {
    const fd = new FormData();
    fd.set("id", id);
    if (kind === "reject") fd.set("note", note);
    start(async () => {
      const res = await (kind === "approve" ? approveEntry(null, fd) : rejectEntry(null, fd));
      if (res?.error) toast("error", res.error);
      else if (res?.success) toast("success", res.success);
    });
  }

  return (
    <div className="mt-3 grid gap-2">
      {rejecting && (
        <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder={t("approvals.reasonPlaceholder")} aria-label={t("approvals.reasonPlaceholder")} />
      )}
      <div className="flex flex-wrap items-center gap-2">
        {pending && <Spinner className="text-emerald-700" />}
        {rejecting ? (
          <>
            <Button type="button" variant="danger" className="px-3 py-1.5" disabled={pending} onClick={() => run("reject")} data-testid="reject-confirm">
              {t("approvals.reject")}
            </Button>
            <Button type="button" variant="secondary" className="px-3 py-1.5" disabled={pending} onClick={() => setRejecting(false)}>
              {t("common.cancel")}
            </Button>
          </>
        ) : (
          <>
            <Button type="button" className="px-3 py-1.5" disabled={pending} onClick={() => run("approve")} data-testid="approve">
              {t("approvals.approve")}
            </Button>
            <Button type="button" variant="secondary" className="px-3 py-1.5" disabled={pending} onClick={() => setRejecting(true)} data-testid="reject">
              {t("approvals.reject")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
