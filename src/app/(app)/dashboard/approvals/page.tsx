import type { Metadata } from "next";
import { ApprovalButtons } from "@/components/approval-buttons";
import { ConfirmForm } from "@/components/confirm-form";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import type { PendingEntry } from "@/lib/approvals";
import { describeEntries } from "@/lib/approvals-describe";
import { MANAGERS, requireRole } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { cancelEntry } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("approvals.title") };
}

export default async function ApprovalsPage() {
  const { supabase, farm, role, user } = await requireRole([...MANAGERS, "vet"]);
  const i18n = await getI18n();
  const { t, f } = i18n;
  const isManager = MANAGERS.includes(role);

  const { data } = await supabase
    .from("pending_entries")
    .select("*")
    .eq("farm_id", farm.id)
    .order("created_at", { ascending: false })
    .limit(100);
  const entries = (data ?? []) as PendingEntry[];
  const mine = isManager ? entries : entries.filter((e) => e.submitted_by === user.id);
  const descriptions = await describeEntries({ supabase, farm, i18n }, mine);

  const ids = [...new Set(mine.flatMap((e) => [e.submitted_by, e.resolved_by]).filter((x): x is string => !!x))];
  const { data: people } = ids.length ? await supabase.from("profiles").select("id, full_name").in("id", ids) : { data: [] };
  const nameOf = new Map((people ?? []).map((p) => [p.id as string, (p.full_name || "—") as string]));

  const waiting = mine.filter((e) => e.status === "pending");
  const done = mine.filter((e) => e.status !== "pending").slice(0, 30);

  const card = (e: PendingEntry, actions: React.ReactNode) => {
    const d = descriptions.get(e.id);
    return (
      <li key={e.id} data-testid="approval-item" className="rounded-xl border border-stone-200 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="font-medium text-stone-900">{d?.title}</p>
          <Badge tone={e.status === "pending" ? "amber" : e.status === "approved" ? "green" : "red"}>{t(`approvals.status.${e.status}`)}</Badge>
        </div>
        <ul className="mt-1.5 space-y-0.5 text-sm text-stone-600">
          {d?.lines.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-stone-500">
          {isManager && e.submitted_by ? `${t("approvals.by", { name: nameOf.get(e.submitted_by) ?? "—" })} · ` : ""}
          {f.dateTime(e.created_at)}
          {e.status !== "pending" && e.resolved_by && isManager ? ` · ${t("approvals.decidedBy", { name: nameOf.get(e.resolved_by) ?? "—" })}` : ""}
        </p>
        {e.status === "rejected" && e.note && <p className="mt-1 rounded-lg bg-red-50 px-3 py-1.5 text-sm text-red-700">{t("approvals.reason", { note: e.note })}</p>}
        {actions}
      </li>
    );
  };

  return (
    <>
      <PageHeader title={t("approvals.title")} description={t(isManager ? "approvals.descManager" : "approvals.descVet")} />
      <div className="grid max-w-3xl gap-6">
        <Card title={t(isManager ? "approvals.waitingManager" : "approvals.waitingVet")}>
          {waiting.length === 0 ? (
            <EmptyState title={t("approvals.none")} />
          ) : (
            <ul className="grid gap-3">
              {waiting.map((e) =>
                card(e, isManager ? <ApprovalButtons id={e.id} /> : <div className="mt-3"><ConfirmForm action={cancelEntry} fields={{ id: e.id }} label={t("approvals.cancel")} /></div>),
              )}
            </ul>
          )}
        </Card>
        {done.length > 0 && (
          <Card title={t("approvals.history")}>
            <ul className="grid gap-3">{done.map((e) => card(e, null))}</ul>
          </Card>
        )}
      </div>
    </>
  );
}
