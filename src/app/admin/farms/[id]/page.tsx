import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, PageHeader, StatCard, Table, Td } from "@/components/ui";
import { requireSuperAdmin } from "@/lib/auth";
import { today } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import type { Farm } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("admin.farmDetail") };
}

export default async function AdminFarmDetailPage({ params }: PageProps<"/admin/farms/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase } = await requireSuperAdmin();
  const { t, e, f, o } = await getI18n();

  const since = today(-29);
  const [farmRes, membersRes, cattleRes, flocksRes, milkRes, eggsRes] = await Promise.all([
    supabase.from("farms").select("*").eq("id", id).maybeSingle(),
    supabase.from("farm_members").select("user_id, role, created_at").eq("farm_id", id).order("created_at"),
    supabase.from("cattle").select("id", { count: "exact", head: true }).eq("farm_id", id).eq("status", "active").is("deleted_at", null),
    supabase.from("flocks").select("id", { count: "exact", head: true }).eq("farm_id", id).eq("status", "active").is("deleted_at", null),
    supabase.from("milk_records").select("quantity_liters").eq("farm_id", id).gte("record_date", since),
    supabase.from("flock_daily_logs").select("eggs_collected").eq("farm_id", id).gte("log_date", since),
  ]);
  const farm = farmRes.data as Farm | null;
  if (!farm) notFound();

  const members = membersRes.data ?? [];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", members.map((m) => m.user_id));
  const names = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  const milk = (milkRes.data ?? []).reduce((s, r) => s + Number(r.quantity_liters), 0);
  const eggs = (eggsRes.data ?? []).reduce((s, r) => s + r.eggs_collected, 0);

  return (
    <>
      <PageHeader
        title={farm.name}
        description={[farm.location, farm.currency].filter(Boolean).join(" · ")}
        action={
          <Link href="/admin/farms" className="text-sm text-stone-500 hover:text-stone-900">
            {t("admin.farmBack")}
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Badge tone={farm.suspended ? "red" : "green"}>{farm.suspended ? t("admin.statusSuspended") : t("admin.statusActive")}</Badge>
        <Badge tone="blue">{e(farm.plan)}</Badge>
        {farm.has_dairy && <Badge>{o("txn_module", "dairy")}</Badge>}
        {farm.has_layer && <Badge>{o("txn_module", "layer")}</Badge>}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label={t("admin.activeCattle")} value={f.number(cattleRes.count ?? 0)} />
        <StatCard label={t("admin.activeFlocks")} value={f.number(flocksRes.count ?? 0)} />
        <StatCard label={t("admin.milk30")} value={t("common.litersShort", { n: f.number(milk, 0) })} />
        <StatCard label={t("admin.eggs30")} value={f.number(eggs)} />
      </div>

      <Card title={t("admin.teamTitle")} className="mt-6">
        <Table head={[t("common.name"), t("common.role"), t("admin.colJoined")]}>
          {members.map((m) => (
            <tr key={m.user_id}>
              <Td>{names.get(m.user_id) ?? "—"}</Td>
              <Td>
                <Badge tone={m.role === "owner" ? "green" : "default"}>{e(m.role)}</Badge>
              </Td>
              <Td>{f.date(m.created_at)}</Td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
