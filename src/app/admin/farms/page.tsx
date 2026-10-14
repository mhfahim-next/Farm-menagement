import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmForm } from "@/components/confirm-form";
import { Badge, Card, EmptyState, Input, PageHeader, Select, Table, Td } from "@/components/ui";
import { requireSuperAdmin } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import type { AdminFarmRow } from "@/lib/types";
import { deleteFarm, setFarmPlan, setFarmSuspended } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("admin.farmsTitle") };
}

const PAGE_SIZE = 25;
const plans = ["free", "pro", "business"] as const;

export default async function AdminFarmsPage({ searchParams }: PageProps<"/admin/farms">) {
  const { supabase } = await requireSuperAdmin();
  const { t, e, f } = await getI18n();

  const sp = await searchParams;
  const search = typeof sp.q === "string" ? sp.q.trim() : "";
  const page = Math.max(1, Number(typeof sp.page === "string" ? sp.page : 1) || 1);

  const { data, error } = await supabase.rpc("admin_list_farms", {
    p_search: search || undefined,
    p_limit: PAGE_SIZE,
    p_offset: (page - 1) * PAGE_SIZE,
  });
  if (error) throw new Error(error.message);
  const farms = (data ?? []) as AdminFarmRow[];
  const total = farms[0]?.total_count ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (p: number) => `?${new URLSearchParams({ ...(search ? { q: search } : {}), page: String(p) })}`;

  return (
    <>
      <PageHeader title={t("admin.farmsTitle")} description={t("admin.total", { n: total })} />

      <Card>
        <form className="mb-4 flex flex-wrap gap-2">
          <Input name="q" defaultValue={search} placeholder={t("admin.searchFarms")} className="max-w-sm" />
          <button className="rounded-lg border border-stone-300 px-3 text-sm hover:bg-stone-50">{t("admin.search")}</button>
        </form>

        {farms.length === 0 ? (
          <EmptyState title={t("admin.empty")} />
        ) : (
          <Table
            head={[
              t("admin.colFarm"),
              t("admin.colOwner"),
              t("admin.colPlan"),
              t("admin.colSize"),
              t("admin.colStatus"),
              t("admin.colActions"),
            ]}
          >
            {farms.map((fm) => (
              <tr key={fm.id}>
                <Td>
                  <Link href={`/admin/farms/${fm.id}`} className="font-medium text-emerald-700 hover:underline">
                    {fm.name}
                  </Link>
                  <span className="block text-xs text-stone-500">{f.date(fm.created_at)}</span>
                </Td>
                <Td>
                  {fm.owner_name ?? "—"}
                  <span className="block text-xs text-stone-500">{fm.owner_email}</span>
                </Td>
                <Td>
                  <ConfirmForm action={setFarmPlan} fields={{ id: fm.id }} label={t("admin.setPlan")}>
                    <Select
                      name="plan"
                      defaultValue={fm.plan}
                      className="w-auto py-1 text-xs"
                      options={plans.map((p) => ({ value: p, label: e(p) }))}
                    />
                  </ConfirmForm>
                </Td>
                <Td className="text-xs">
                  {t("admin.members", { n: fm.members })}
                  <br />
                  {fm.has_dairy && <>{t("admin.cattleCount", { n: fm.cattle })}<br /></>}
                  {fm.has_layer && t("admin.flocksCount", { n: fm.flocks })}
                </Td>
                <Td>
                  <Badge tone={fm.suspended ? "red" : "green"}>
                    {fm.suspended ? t("admin.statusSuspended") : t("admin.statusActive")}
                  </Badge>
                </Td>
                <Td>
                  <span className="flex flex-wrap items-start gap-2">
                    <ConfirmForm
                      action={setFarmSuspended}
                      fields={{ id: fm.id, suspended: String(!fm.suspended) }}
                      confirm={t(fm.suspended ? "admin.confirmUnsuspendFarm" : "admin.confirmSuspendFarm", { name: fm.name })}
                      label={fm.suspended ? t("admin.unsuspendFarm") : t("admin.suspendFarm")}
                    />
                    <ConfirmForm
                      action={deleteFarm}
                      fields={{ id: fm.id }}
                      confirm={t("admin.confirmDeleteFarm", { name: fm.name })}
                      label={t("admin.deleteFarm")}
                      variant="danger"
                    />
                  </span>
                </Td>
              </tr>
            ))}
          </Table>
        )}

        {lastPage > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm">
            {page > 1 ? <Link href={href(page - 1)} className="text-emerald-700 hover:underline">{t("admin.prev")}</Link> : <span />}
            <span className="text-stone-500">{f.number(page)} / {f.number(lastPage)}</span>
            {page < lastPage ? <Link href={href(page + 1)} className="text-emerald-700 hover:underline">{t("admin.next")}</Link> : <span />}
          </div>
        )}
      </Card>
    </>
  );
}
