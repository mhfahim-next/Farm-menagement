import type { Metadata } from "next";
import { ConfirmForm } from "@/components/confirm-form";
import { InviteList, type PendingInvite } from "@/components/invite-list";
import { Badge, Button, Card, EmptyState, PageHeader, StatCard, Table, Td } from "@/components/ui";
import { requireDoctor } from "@/lib/auth";
import { today } from "@/lib/format";
import { dueItems } from "@/lib/health";
import { getI18n } from "@/lib/i18n/server";
import { switchFarm } from "@/lib/farm-actions";
import { leaveFarmById } from "./actions";
import type { HealthRecord } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("doctor.consoleMeta") };
}

type VetFarm = { role: string; farms: { id: string; name: string; location: string | null; owner_id: string; suspended: boolean } | null };

export default async function DoctorConsolePage() {
  const { user, supabase } = await requireDoctor();
  const i18n = await getI18n();
  const { t, f } = i18n;

  const [{ data: memberships }, { data: inviteRows }] = await Promise.all([
    supabase.from("farm_members").select("role, farms(id, name, location, owner_id, suspended)").eq("user_id", user.id).eq("role", "vet"),
    supabase.rpc("my_pending_invites"),
  ]);
  const farms = ((memberships ?? []) as unknown as VetFarm[])
    .map((m) => m.farms)
    .filter((x): x is NonNullable<VetFarm["farms"]> => Boolean(x) && !x!.suspended);
  const ids = farms.map((x) => x.id);

  // Everything below is scoped by RLS to the farms this doctor serves.
  const [cattle, records, owners] = ids.length
    ? await Promise.all([
        supabase.from("cattle").select("id, farm_id").in("farm_id", ids).eq("status", "active").is("deleted_at", null),
        supabase.from("health_records").select("*").in("farm_id", ids).not("next_due_date", "is", null),
        supabase.from("profiles").select("id, full_name").in("id", farms.map((x) => x.owner_id)),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const ownerName = new Map((owners.data ?? []).map((p) => [p.id, p.full_name]));
  const day = today();
  const stats = farms.map((farm) => {
    const animals = (cattle.data ?? []).filter((c) => c.farm_id === farm.id);
    const active = new Set(animals.map((a) => a.id));
    const due = dueItems(((records.data ?? []) as HealthRecord[]).filter((r) => r.farm_id === farm.id), day, 0).filter(
      (d) => d.overdue && active.has(d.record.cattle_id),
    );
    return { farm, animals: animals.length, overdue: due.length };
  });
  const totalAnimals = stats.reduce((s, x) => s + x.animals, 0);
  const totalOverdue = stats.reduce((s, x) => s + x.overdue, 0);

  return (
    <>
      <PageHeader title={t("doctor.consoleTitle")} description={t("doctor.consoleDesc")} />

      {(inviteRows?.length ?? 0) > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">{t("invites.title")}</h2>
          <InviteList invites={(inviteRows ?? []) as PendingInvite[]} i18n={i18n} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <StatCard label={t("doctor.farms")} value={f.number(farms.length)} />
        <StatCard label={t("doctor.animals")} value={f.number(totalAnimals)} />
        <StatCard label={t("doctor.overdue")} value={f.number(totalOverdue)} tone={totalOverdue ? "bad" : "good"} />
      </div>

      <Card className="mt-6">
        {stats.length === 0 ? (
          <EmptyState title={t("doctor.emptyTitle")}>{t("doctor.emptyBody")}</EmptyState>
        ) : (
          <Table head={[t("doctor.colFarm"), t("doctor.colOwner"), t("doctor.colAnimals"), t("doctor.colAttention"), ""]}>
            {stats.map(({ farm, animals, overdue }) => (
              <tr key={farm.id}>
                <Td>
                  <span className="font-medium text-stone-900">{farm.name}</span>
                  {farm.location && <span className="block text-xs text-stone-500">{farm.location}</span>}
                </Td>
                <Td>{ownerName.get(farm.owner_id) ?? "—"}</Td>
                <Td className="tabular-nums">{f.number(animals)}</Td>
                <Td>
                  {overdue > 0 ? <Badge tone="red">{t("doctor.attention", { n: overdue })}</Badge> : <Badge tone="green">{t("doctor.allGood")}</Badge>}
                </Td>
                <Td className="text-right">
                  <span className="inline-flex items-start gap-2">
                    <form action={switchFarm.bind(null, farm.id)}>
                      <Button type="submit" variant="secondary" className="px-3 py-1.5" data-testid={`open-farm-${farm.id}`}>
                        {t("doctor.open")}
                      </Button>
                    </form>
                    <ConfirmForm
                      action={leaveFarmById}
                      fields={{ farm_id: farm.id }}
                      confirm={t("team.confirmLeave", { farm: farm.name })}
                      label={t("team.leave")}
                    />
                  </span>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
