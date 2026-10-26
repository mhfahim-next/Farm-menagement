import type { Metadata } from "next";
import { FarmKindFields } from "@/components/farm-kind-fields";
import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { LimitNotice } from "@/components/limit-notice";
import { ConfirmForm } from "@/components/confirm-form";
import { Badge, Button, ButtonLink, Card, Field, Input, PageHeader, Select, Table, Td } from "@/components/ui";
import { MANAGERS, requireRole, STAFF } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { planName } from "@/lib/plan-utils";
import { getPlanContext } from "@/lib/plans";
import { updateFarm } from "./actions";
import { inviteMember, leaveFarm, removeMember, revokeInvite } from "./team-actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("settings.meta") };
}

export default async function SettingsPage() {
  const { supabase, farm, role, user } = await requireRole(STAFF);
  const { t, o, f, options, locale } = await getI18n();
  const canEdit = MANAGERS.includes(role);
  const { plan, usage, limits, states } = await getPlanContext();

  const [{ data: members }, { data: invites }] = await Promise.all([
    supabase.from("farm_members").select("user_id, role, created_at").eq("farm_id", farm.id).order("created_at"),
    canEdit
      ? supabase.from("farm_invites").select("id, email, role, created_at").eq("farm_id", farm.id).eq("status", "pending").order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, account_type, doctor_verified, doctor_reg_no")
    .in("id", (members ?? []).map((m) => m.user_id));
  const people = new Map((profiles ?? []).map((p) => [p.id, p]));
  const inviteRoles = options("member_role").filter((r) => ["manager", "worker", "vet"].includes(r.value) && (r.value !== "manager" || role === "owner"));

  return (
    <>
      <PageHeader title={t("settings.title")} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="grid content-start gap-6">
          <Card title={t("settings.farmTitle")}>
            <ActionForm action={updateFarm} submitLabel={t("settings.saveSettings")}>
              <fieldset disabled={!canEdit} className="grid gap-4 disabled:opacity-70">
                <Field label={t("settings.farmName")}>
                  <Input name="name" defaultValue={farm.name} required />
                </Field>
                <Field label={t("common.location")}>
                  <Input name="location" defaultValue={farm.location ?? ""} />
                </Field>
                <Field label={t("common.currency")}>
                  <Select name="currency" defaultValue={farm.currency} options={options("currency", farm.currency)} />
                </Field>
                <FarmKindFields t={t} farm={farm} />
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-stone-200 p-3 has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50">
                  <input type="checkbox" name="show_animal_profit" defaultChecked={farm.show_animal_profit ?? true} className="mt-1 accent-emerald-700" data-testid="show-animal-profit" />
                  <span aria-hidden className="text-xl leading-none">
                    💰
                  </span>
                  <span>
                    <span className="block text-sm font-medium">{t("aprofit.settingTitle")}</span>
                    <span className="block text-xs text-stone-500">{t("aprofit.settingBody")}</span>
                  </span>
                </label>
              </fieldset>
            </ActionForm>
          </Card>

          <Card title={t("settings.planTitle")}>
            <p className="text-sm text-stone-600">{t("settings.planText", { plan: planName(plan, locale, farm.plan) })}</p>
            <p className="mt-2 text-sm text-stone-500">
              {t("plan.usage.cattle")}: {limits.cattle === null ? t("plan.usageUnlimited", { used: usage.cattle }) : t("plan.usageOf", { used: usage.cattle, max: limits.cattle })}
              {farm.has_goat && (
                <>
                  {" · "}
                  {t("plan.usage.goats")}: {limits.goats === null ? t("plan.usageUnlimited", { used: usage.goats }) : t("plan.usageOf", { used: usage.goats, max: limits.goats })}
                </>
              )}
              {" · "}
              {t("plan.usage.flocks")}: {limits.flocks === null ? t("plan.usageUnlimited", { used: usage.flocks }) : t("plan.usageOf", { used: usage.flocks, max: limits.flocks })}
            </p>
            {canEdit && (
              <ButtonLink href="/dashboard/plan" variant="secondary" className="mt-3">
                {t("plan.upgradeBtn")}
              </ButtonLink>
            )}
          </Card>

          <Card title={t("settings.accountTitle")}>
            <p className="mb-3 text-sm text-stone-600">{t("settings.signedInAs", { email: user.email ?? "" })}</p>
            <div className="flex flex-wrap gap-2">
              <form action="/auth/signout" method="post">
                <Button variant="secondary" type="submit">{t("menu.logout")}</Button>
              </form>
              {role !== "owner" && (
                <ConfirmForm action={leaveFarm} fields={{}} confirm={t("team.confirmLeave", { farm: farm.name })} label={t("team.leave")} variant="danger" />
              )}
            </div>
          </Card>
        </div>

        <div className="grid content-start gap-6">
          <Card title={t("team.title")} description={t("team.desc")}>
            <Table head={[t("team.colName"), t("team.colRole"), ""]}>
              {(members ?? []).map((m) => {
                const person = people.get(m.user_id);
                return (
                  <tr key={m.user_id}>
                    <Td>
                      {person?.full_name ?? "—"}
                      {m.user_id === user.id && <span className="text-stone-500"> {t("common.you")}</span>}
                      {person?.account_type === "doctor" && (
                        <span className="mt-0.5 block">
                          <Badge tone={person.doctor_verified ? "green" : "amber"}>
                            {person.doctor_verified ? `✓ ${t("doctor.badgeVerified")}` : t("doctor.badgeUnverified")}
                          </Badge>
                          {person.doctor_reg_no && <span className="ml-1.5 text-xs text-stone-500">{person.doctor_reg_no}</span>}
                        </span>
                      )}
                    </Td>
                    <Td>
                      <Badge tone={m.role === "owner" ? "green" : m.role === "vet" ? "blue" : "default"}>{o("member_role", m.role)}</Badge>
                    </Td>
                    <Td className="text-right">
                      {role === "owner" && m.role !== "owner" && (
                        <ConfirmForm
                          action={removeMember}
                          fields={{ user_id: m.user_id }}
                          confirm={t("team.confirmRemove", { who: person?.full_name ?? "" })}
                          label={t("team.remove")}
                        />
                      )}
                    </Td>
                  </tr>
                );
              })}
            </Table>
            <p className="mt-3 text-xs text-stone-500">{t("team.rolesNote")}</p>
          </Card>

          {canEdit && (
            <>
              <Card title={t("team.inviteTitle")}>
                <LimitNotice t={t} kind="members" state={states.members} used={usage.members} max={limits.members} plan={planName(plan, locale, farm.plan)} canUpgrade />
                <ActionForm action={inviteMember} submitLabel={t("team.inviteSubmit")}>
                  <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
                    <Field label={t("team.inviteEmail")}>
                      <Input name="email" type="email" required placeholder="name@example.com" />
                    </Field>
                    <Field label={t("team.inviteRole")}>
                      <Select name="role" defaultValue="worker" options={inviteRoles} />
                    </Field>
                  </div>
                  <p className="text-xs text-stone-500">
                    {t("team.inviteHint")}{" "}
                    <Link href="/doctor/signup" className="text-emerald-700 hover:underline">
                      {t("doctor.doctorSignup")}
                    </Link>
                  </p>
                </ActionForm>
              </Card>

              <Card title={t("team.pendingTitle")}>
                {(invites ?? []).length === 0 ? (
                  <p className="text-sm text-stone-500">{t("team.pendingEmpty")}</p>
                ) : (
                  <ul className="divide-y divide-stone-100">
                    {(invites ?? []).map((inv) => (
                      <li key={inv.id} className="flex flex-wrap items-center justify-between gap-3 py-2 text-sm" data-testid="pending-invite">
                        <span>
                          <span className="font-medium">{inv.email}</span>{" "}
                          <Badge tone={inv.role === "vet" ? "blue" : "default"}>{o("member_role", inv.role)}</Badge>
                          <span className="ml-2 text-xs text-stone-500">{f.date(inv.created_at)}</span>
                        </span>
                        <ConfirmForm action={revokeInvite} fields={{ id: inv.id }} label={t("team.revoke")} />
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </>
          )}
        </div>
      </div>
    </>
  );
}
