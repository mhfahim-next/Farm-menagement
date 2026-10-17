import type { Metadata } from "next";
import { ClickRow } from "@/components/click-row";
import { Badge, ButtonLink, Card, EmptyState, PageHeader, StatCard, Table, Td } from "@/components/ui";
import { MANAGERS, requireRole } from "@/lib/auth";
import { today } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { isMonth, payroll, type AttendanceStatus } from "@/lib/staff";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("staff.meta") };
}

export default async function StaffPage() {
  const { supabase, farm } = await requireRole(MANAGERS);
  const { t, f, o } = await getI18n();
  const month = today().slice(0, 7);
  if (!isMonth(month)) throw new Error("bad month");

  const [staffRes, attRes, payRes, todayRes] = await Promise.all([
    supabase.from("staff").select("*").eq("farm_id", farm.id).order("active", { ascending: false }).order("name"),
    supabase.from("staff_attendance").select("staff_id, status").eq("farm_id", farm.id).gte("att_date", `${month}-01`).lte("att_date", `${month}-31`),
    supabase.from("staff_payments").select("staff_id, pay_type, amount").eq("farm_id", farm.id).eq("pay_month", `${month}-01`),
    supabase.from("staff_attendance").select("staff_id, status").eq("farm_id", farm.id).eq("att_date", today()),
  ]);
  const staff = staffRes.data ?? [];
  const todayStatus = new Map((todayRes.data ?? []).map((a) => [a.staff_id, a.status as AttendanceStatus]));

  const rows = staff.map((s) => {
    const p = payroll(
      Number(s.monthly_salary),
      month,
      (attRes.data ?? []).filter((a) => a.staff_id === s.id) as { status: AttendanceStatus }[],
      (payRes.data ?? []).filter((x) => x.staff_id === s.id) as { pay_type: "salary" | "advance" | "bonus"; amount: number }[],
    );
    return { s, p };
  });
  const active = rows.filter((r) => r.s.active);
  const money = (n: number) => f.money(n, farm.currency);

  return (
    <>
      <PageHeader
        title={t("staff.title")}
        description={t("staff.desc")}
        action={
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/dashboard/staff/attendance" variant="secondary">{t("staff.attendanceButton")}</ButtonLink>
            <ButtonLink href="/dashboard/staff/new">+ {t("staff.addTitle")}</ButtonLink>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label={t("staff.activeCount")} value={f.number(active.length)} />
        <StatCard label={t("staff.monthlyBill")} value={money(active.reduce((s, r) => s + Number(r.s.monthly_salary), 0))} />
        <StatCard label={t("staff.paidThisMonth")} value={money(active.reduce((s, r) => s + r.p.paid + r.p.bonus, 0))} />
        <StatCard
          label={t("staff.dueThisMonth")}
          value={money(active.reduce((s, r) => s + Math.max(0, r.p.balance), 0))}
          tone={active.some((r) => r.p.balance > 0) ? "bad" : "good"}
        />
      </div>

      <Card className="mt-6" title={t("staff.listTitle")} description={t("staff.monthNote", { month: f.date(`${month}-01`) })}>
        {rows.length === 0 ? (
          <EmptyState title={t("staff.emptyTitle")}>{t("staff.emptyBody")}</EmptyState>
        ) : (
          <Table head={[t("staff.colName"), t("staff.colModule"), t("staff.colSalary"), t("staff.colToday"), t("staff.colDue")]}>
            {rows.map(({ s, p }) => {
              const st = todayStatus.get(s.id);
              return (
                <ClickRow key={s.id} href={`/dashboard/staff/${s.id}`}>
                  <Td>
                    <span className="font-medium text-stone-900">{s.name}</span>
                    <span className="block text-xs text-stone-500">
                      {[s.position ? o("staff_position", s.position) : null, s.phone].filter(Boolean).join(" · ") || "—"}
                    </span>
                    {!s.active && <Badge tone="default">{t("staff.inactive")}</Badge>}
                  </Td>
                  <Td>{t(`staff.module.${s.module as "dairy" | "layer" | "both"}`)}</Td>
                  <Td className="tabular-nums">{money(Number(s.monthly_salary))}</Td>
                  <Td>
                    {st ? (
                      <Badge tone={st === "present" ? "green" : st === "absent" ? "red" : "amber"}>{o("attendance_status", st)}</Badge>
                    ) : (
                      <span className="text-xs text-stone-400">—</span>
                    )}
                  </Td>
                  <Td className="tabular-nums">
                    {s.active ? (
                      <span className={p.balance > 0 ? "font-medium text-red-600" : "text-stone-700"}>{money(Math.max(0, p.balance))}</span>
                    ) : (
                      "—"
                    )}
                  </Td>
                </ClickRow>
              );
            })}
          </Table>
        )}
      </Card>
    </>
  );
}
