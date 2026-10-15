import type { Metadata } from "next";
import Link from "next/link";
import { RequestResolver } from "@/components/request-resolver";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { requireSuperAdmin } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { planName } from "@/lib/plan-utils";
import { getPlans } from "@/lib/plans";
import type { AdminRequestRow } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("admin.requests.title") };
}

const statusTone = { open: "amber", approved: "green", rejected: "red", resolved: "blue" } as const;

export default async function AdminRequestsPage({ searchParams }: PageProps<"/admin/requests">) {
  const { supabase } = await requireSuperAdmin();
  const { t, f, locale } = await getI18n();
  const sp = await searchParams;
  const showAll = sp.show === "all";
  const plans = await getPlans();

  let query = supabase.from("requests").select("*").order("priority", { ascending: false }).order("created_at", { ascending: false }).limit(100);
  if (!showAll) query = query.eq("status", "open");
  const { data } = await query;
  const requests = (data ?? []) as AdminRequestRow[];

  const { data: farmRows } = requests.length
    ? await supabase.from("farms").select("id, name, plan").in("id", [...new Set(requests.map((r) => r.farm_id))])
    : { data: [] };
  const { data: people } = requests.length
    ? await supabase.from("profiles").select("id, full_name").in("id", [...new Set(requests.map((r) => r.requested_by).filter(Boolean) as string[])])
    : { data: [] };
  const farmById = new Map((farmRows ?? []).map((x) => [x.id, x]));
  const personById = new Map((people ?? []).map((p) => [p.id, p.full_name]));
  const nameOf = (key: string | null) => planName(plans.find((p) => p.key === key), locale, key ?? "");

  return (
    <>
      <PageHeader
        title={t("admin.requests.title")}
        description={t("admin.requests.desc")}
        action={
          <div className="flex gap-2 text-sm">
            <Link href="/admin/requests" className={`rounded-lg px-3 py-1.5 ${!showAll ? "bg-emerald-700 text-white" : "border border-stone-300"}`}>
              {t("admin.requests.open")}
            </Link>
            <Link href="/admin/requests?show=all" className={`rounded-lg px-3 py-1.5 ${showAll ? "bg-emerald-700 text-white" : "border border-stone-300"}`}>
              {t("admin.requests.all")}
            </Link>
          </div>
        }
      />

      {requests.length === 0 ? (
        <EmptyState title={t("admin.requests.empty")} />
      ) : (
        <div className="grid gap-4">
          {requests.map((r) => {
            const farm = farmById.get(r.farm_id);
            return (
              <Card key={r.id} className={r.priority && r.status === "open" ? "border-sky-400" : ""}>
                <div data-testid="request-card">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-stone-900">
                        {r.kind === "upgrade" ? t("plan.kind.upgrade", { plan: nameOf(r.plan_requested) }) : r.subject || t("plan.kind.support")}
                      </p>
                      <p className="text-sm text-stone-500">
                        {t("admin.requests.from", { who: personById.get(r.requested_by ?? "") ?? "—", farm: farm?.name ?? "—" })}
                        {" · "}
                        {t("admin.requests.currentPlan", { plan: nameOf(farm?.plan ?? null) })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.priority && <Badge tone="blue">{t("plan.priorityBadge")}</Badge>}
                      <Badge tone={statusTone[r.status]}>{t(`plan.status.${r.status}`)}</Badge>
                      <span className="text-xs text-stone-500">{f.dateTime(r.created_at)}</span>
                    </div>
                  </div>
                  {r.message && <p className="mt-3 whitespace-pre-line rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-700">{r.message}</p>}
                  {r.admin_reply && (
                    <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                      <strong>{t("plan.adminReply")}:</strong> {r.admin_reply}
                    </p>
                  )}
                  {r.status === "open" && (
                    <RequestResolver
                      id={r.id}
                      kind={r.kind}
                      confirmApprove={t("admin.requests.confirmApprove", { plan: nameOf(r.plan_requested), farm: farm?.name ?? "" })}
                    />
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
