"use client";

import { useState, useTransition } from "react";
import { reviewPayment } from "@/app/admin/payments/actions";
import { useI18n } from "./i18n-provider";
import { useToast } from "./toast";
import { Button, Input, Spinner } from "./ui";

/** Note + Accept / Decline for a payment waiting in the admin inbox. */
export function PaymentReviewer({ id, confirmApprove }: { id: string; confirmApprove: string }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();

  const run = (approve: boolean) => {
    if (approve && !window.confirm(confirmApprove)) return;
    if (!approve && !note.trim() && !window.confirm(t("adminpay.rejectNoNote"))) return;
    start(async () => {
      const res = await reviewPayment(id, approve, note);
      if (res?.error) toast("error", res.error);
      else if (res?.success) toast("success", res.success);
    });
  };

  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
      <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} placeholder={t("adminpay.notePlaceholder")} aria-label={t("adminpay.notePlaceholder")} />
      <div className="flex items-center gap-2">
        {pending && <Spinner className="text-emerald-700" />}
        <Button type="button" disabled={pending} onClick={() => run(true)} data-testid="approve-payment">
          {t("adminpay.approve")}
        </Button>
        <Button type="button" variant="secondary" disabled={pending} onClick={() => run(false)} data-testid="reject-payment">
          {t("adminpay.reject")}
        </Button>
      </div>
    </div>
  );
}
