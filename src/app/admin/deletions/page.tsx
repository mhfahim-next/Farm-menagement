import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmForm } from "@/components/confirm-form";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { requireSuperAdmin } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { cancelAccountDeletion, deleteAccountNow } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("adel.title") };
}

const FILTERS = ["pending", "cancelled", "deleted", "all"] as const;

type Farm = { name?: string; plan?: string; kinds?: string[]; animals?: number; flocks?: number };
type Req = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  reason: string | null;
  note: string | null;
  farms: Farm[];
  other_farms: { name: string; role: string }[];
  source: "web" | "app";
  status: "pending" | "cancelled" | "deleted";
  requested_at: string;
  delete_after: string;
  cancelled_at: string | null;
  cancelled_by: "login" | "admin" | null;
  deleted_at: string | null;
  deleted_by: "schedule" | "admin" | null;
  blocked: string | null;
};

/** WhatsApp link for a Bangladeshi number written the usual ways (01…, +880…, 880…). */
const whatsapp = (phone: string) => {
  const d = phone.replace(/\D/g, "");
  const intl = d.startsWith("880") ? d : d.startsWith("0") ? `88${d}` : d;
  return `https://wa.me/${intl}`;
};

/** Whole days until the deletion (0 = with the next run). */
const daysLeft = (iso: string) => Math.max(0, Math.ceil((Date.parse(iso) - Date.now()) / 86_400_000));

/** People who asked to delete their account: who, why, what goes, and Keep / Delete now. */
export default async function AdminDeletionsPage({ searchParams }: PageProps<"/admin/deletions">) {
  const { supabase } = await requireSuperAdmin();
  const { t, f, maybe } = await getI18n();
  const sp = await searchParams;
  const filter = FILTERS.find((x) => x === sp.status) ?? "pending";
  let q = supabase.from("account_deletion_requests").select("*").order("requested_at", { ascending: false }).limit(200);
  if (filter !== "all") q = q.eq("status", filter);
  const { data } = await q;
  const rows = (data ?? []) as Req[];

  return (
    <>
      <PageHeader title={t("adel.title")} description={t("adel.desc")} />
      <div className="mb-4 inline-flex rounded-lg border border-stone-300 p-0.5 text-sm">
        {FILTERS.map((x) => (
          <Link key={x} href={`?status=${x}`} className={`rounded-md px-3 py-1.5 font-medium ${filter === x ? "bg-emerald-700 text-white" : "text-stone-600 hover:bg-stone-100"}`}>
            {t(`adel.filter.${x}`)}
          </Link>
        ))}
      </div>
      {rows.length === 0 ? (
        <Card>
          <EmptyState title={t("adel.empty")} />
        </Card>
      ) : (
        <div className="grid gap-4" data-testid="deletion-list">
          {rows.map((r) => {
            const days = daysLeft(r.delete_after);
            return (
              <Card key={r.id}>
                <div data-testid={`deletion-${r.id}`} className="grid gap-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      {r.status === "deleted" ? (
                        <p className="text-sm text-stone-500">{t("adel.gone")}</p>
                      ) : (
                        <>
                          <p className="font-semibold text-stone-900">{r.full_name || r.email}</p>
                          <p className="mt-0.5 flex flex-wrap gap-x-4 text-sm">
                            {r.email && (
                              <a href={`mailto:${r.email}`} className="text-emerald-700 hover:underline">
                                {r.email}
                              </a>
                            )}
                            {r.phone && (
                              <>
                                <a href={`tel:${r.phone}`} className="text-emerald-700 hover:underline">
                                  {r.phone}
                                </a>
                                <a href={whatsapp(r.phone)} target="_blank" rel="noreferrer" className="text-emerald-700 hover:underline">
                                  {t("adel.whatsapp")}
                                </a>
                              </>
                            )}
                          </p>
                        </>
                      )}
                      <p className="mt-1 text-xs text-stone-500">{t("adel.requestedOn", { date: f.date(r.requested_at), source: t(`adel.source.${r.source}`) })}</p>
                    </div>
                    <div className="text-right text-sm">
                      {r.status === "pending" && (
                        <Badge tone={days <= 3 ? "red" : "amber"}>{days === 0 ? t("adel.deletesToday") : t("adel.deletesOn", { date: f.date(r.delete_after), n: days })}</Badge>
                      )}
                      {r.status === "cancelled" && r.cancelled_by && (
                        <Badge tone="green">{t(`adel.cancelledBy.${r.cancelled_by}`, { date: f.date(r.cancelled_at) })}</Badge>
                      )}
                      {r.status === "deleted" && <Badge>{t("adel.deletedOn", { date: f.date(r.deleted_at), by: t(`adel.by.${r.deleted_by ?? "schedule"}`) })}</Badge>}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{t("adel.reason")}</p>
                      <p className="text-sm text-stone-800" data-testid="deletion-reason">
                        {r.reason ? t(`profile.reason.${r.reason as "other"}`) : t("adel.noReason")}
                      </p>
                      {r.note && (
                        <>
                          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-stone-500">{t("adel.note")}</p>
                          <p className="whitespace-pre-wrap text-sm text-stone-800">{r.note}</p>
                        </>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{t("adel.farms")}</p>
                      {r.farms.length === 0 ? (
                        <p className="text-sm text-stone-600">{t("adel.noFarms")}</p>
                      ) : (
                        <ul className="space-y-1 text-sm text-stone-800" data-testid="deletion-farms">
                          {r.farms.map((x, i) => (
                            <li key={i}>
                              {x.name && <span className="font-medium">{x.name}: </span>}
                              {(x.kinds ?? []).map((k) => maybe(`adel.kind.${k}`) ?? k).join(", ")}
                              <span className="text-stone-500"> · {t("adel.farmLine", { animals: x.animals ?? 0, flocks: x.flocks ?? 0, plan: x.plan ?? "free" })}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {r.other_farms.length > 0 && (
                        <>
                          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-stone-500">{t("adel.otherFarms")}</p>
                          <p className="text-sm text-stone-800">{r.other_farms.map((o) => `${o.name} (${maybe(`enum.${o.role}`) ?? o.role})`).join(", ")}</p>
                        </>
                      )}
                    </div>
                  </div>

                  {r.blocked && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{t("adel.blocked", { farms: r.blocked.replace(/^SHARED_FARM:/, "") })}</p>
                  )}

                  {r.status === "pending" && (
                    <div className="flex flex-wrap gap-2">
                      <ConfirmForm action={cancelAccountDeletion} fields={{ id: r.id }} confirm={t("adel.keepConfirm")} label={t("adel.keep")} variant="secondary" />
                      <ConfirmForm action={deleteAccountNow} fields={{ id: r.id }} confirm={t("adel.deleteNowConfirm")} label={t("adel.deleteNow")} variant="danger" />
                    </div>
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
