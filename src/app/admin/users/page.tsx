import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { ConfirmForm } from "@/components/confirm-form";
import { Badge, Card, EmptyState, Input, PageHeader, Table, Td } from "@/components/ui";
import { requireSuperAdmin } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import type { AdminUserRow } from "@/lib/types";
import { deleteUser, setDoctorVerified, setSuperAdmin, setUserBanned } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("admin.usersTitle") };
}

const PAGE_SIZE = 25;

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  const { supabase, user: me } = await requireSuperAdmin();
  const { t, f } = await getI18n();

  const sp = await searchParams;
  const search = typeof sp.q === "string" ? sp.q.trim() : "";
  const page = Math.max(1, Number(typeof sp.page === "string" ? sp.page : 1) || 1);

  const { data, error } = await supabase.rpc("admin_list_users", {
    p_search: search || undefined,
    p_limit: PAGE_SIZE,
    p_offset: (page - 1) * PAGE_SIZE,
  });
  if (error) throw new Error(error.message);
  const users = (data ?? []) as AdminUserRow[];
  // Last known IP and approximate location (from the hosting edge's geo headers).
  const { data: presence } = users.length
    ? await supabase.from("user_presence").select("user_id, ip, country, region, city, last_seen_at").in("user_id", users.map((u) => u.id))
    : { data: [] };
  const where = new Map((presence ?? []).map((p) => [p.user_id as string, p]));
  const total = users[0]?.total_count ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (p: number) => `?${new URLSearchParams({ ...(search ? { q: search } : {}), page: String(p) })}`;

  return (
    <>
      <PageHeader title={t("admin.usersTitle")} description={t("admin.total", { n: total })} />

      <Card>
        <form className="mb-4 flex flex-wrap gap-2">
          <Input name="q" defaultValue={search} placeholder={t("admin.searchUsers")} className="max-w-sm" />
          <button className="rounded-lg border border-stone-300 px-3 text-sm hover:bg-stone-50">{t("admin.search")}</button>
        </form>

        {users.length === 0 ? (
          <EmptyState title={t("admin.empty")} />
        ) : (
          <Table
            head={[
              t("admin.colUser"),
              t("admin.colFarms"),
              t("admin.colJoined"),
              t("admin.colLastSeen"),
              t("analytics.colLocation"),
              t("admin.colStatus"),
              t("admin.colActions"),
            ]}
          >
            {users.map((u) => {
              const isMe = u.id === me.id;
              const who = u.full_name ? `${u.full_name} (${u.email})` : u.email;
              return (
                <tr key={u.id}>
                  <Td>
                    <span className="flex items-center gap-3">
                      <Avatar url={u.avatar_url} name={u.full_name} email={u.email} size={32} />
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-stone-900">
                          {u.full_name ?? "—"} {isMe && <span className="font-normal text-stone-500">{t("common.you")}</span>}
                        </span>
                        <span className="block truncate text-xs text-stone-500">{u.email}</span>
                        {u.account_type === "doctor" && (
                          <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                            <Badge tone={u.doctor_verified ? "green" : "amber"}>
                              {u.doctor_verified ? `✓ ${t("doctor.badgeVerified")}` : t("admin.doctorBadge")}
                            </Badge>
                            {u.doctor_reg_no && <span className="text-xs text-stone-500">{t("admin.doctor.regNo", { no: u.doctor_reg_no })}</span>}
                          </span>
                        )}
                      </span>
                    </span>
                  </Td>
                  <Td className="tabular-nums">{f.number(u.farm_count)}</Td>
                  <Td>{f.date(u.created_at)}</Td>
                  <Td>{u.last_sign_in_at ? f.dateTime(u.last_sign_in_at) : t("admin.never")}</Td>
                  <Td>
                    {(() => {
                      const p = where.get(u.id);
                      if (!p) return <span className="text-xs text-stone-400">—</span>;
                      const place = [p.city, p.region, p.country].filter(Boolean).join(", ");
                      return (
                        <span className="block text-xs">
                          <span className="block text-stone-700">{place || t("analytics.unknownPlace")}</span>
                          {p.ip && <span className="block font-mono text-stone-500">{p.ip}</span>}
                        </span>
                      );
                    })()}
                  </Td>
                  <Td>
                    <span className="flex flex-wrap gap-1">
                      <Badge tone={u.banned ? "red" : "green"}>
                        {u.banned ? t("admin.statusSuspended") : t("admin.statusActive")}
                      </Badge>
                      {u.is_super_admin && <Badge tone="blue">{t("admin.superAdminBadge")}</Badge>}
                    </span>
                  </Td>
                  <Td>
                    {!isMe && (
                      <span className="flex flex-wrap items-start gap-2">
                        {u.account_type === "doctor" && (
                          <ConfirmForm
                            action={setDoctorVerified}
                            fields={{ id: u.id, value: String(!u.doctor_verified) }}
                            confirm={t(u.doctor_verified ? "admin.doctor.confirmUnverify" : "admin.doctor.confirmVerify", { who })}
                            label={u.doctor_verified ? t("admin.doctor.unverify") : t("admin.doctor.verify")}
                          />
                        )}
                        <ConfirmForm
                          action={setUserBanned}
                          fields={{ id: u.id, banned: String(!u.banned) }}
                          confirm={t(u.banned ? "admin.confirmUnsuspendUser" : "admin.confirmSuspendUser", { who })}
                          label={u.banned ? t("admin.unsuspendUser") : t("admin.suspendUser")}
                        />
                        <ConfirmForm
                          action={setSuperAdmin}
                          fields={{ id: u.id, value: String(!u.is_super_admin) }}
                          confirm={t(u.is_super_admin ? "admin.confirmRemoveAdmin" : "admin.confirmMakeAdmin", { who })}
                          label={u.is_super_admin ? t("admin.removeAdmin") : t("admin.makeAdmin")}
                        />
                        <ConfirmForm
                          action={deleteUser}
                          fields={{ id: u.id }}
                          confirm={t("admin.confirmDeleteUser", { who })}
                          label={t("admin.deleteUser")}
                          variant="danger"
                        />
                      </span>
                    )}
                  </Td>
                </tr>
              );
            })}
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
