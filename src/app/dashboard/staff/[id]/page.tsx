import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { ClickRow } from "@/components/click-row";
import { ConfirmForm } from "@/components/confirm-form";
import { Badge, ButtonLink, Card, EmptyState, Field, Input, PageHeader, Select, StatCard, Table, Td, Textarea } from "@/components/ui";
import { MANAGERS, requireRole } from "@/lib/auth";
import { today } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { daysInMonth, isMonth, payroll, workDaysSoFar, type AttendanceStatus } from "@/lib/staff";
import { addStaffPayment, deleteStaffPayment, updateStaff } from "../actions";
import { moduleChoices } from "../module-choices";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("staff.detailMeta") };
}

export default async function StaffDetailPage({ params, searchParams }: PageProps<"/dashboard/staff/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const { supabase, farm } = await requireRole(MANAGERS);
  const { t, f, o, options } = await getI18n();

  const month = isMonth(sp.month) ? sp.month : today().slice(0, 7);
  const last = `${month}-${String(daysInMonth(month)).padStart(2, "0")}`;

  const [staffRes, attRes, payRes] = await Promise.all([
    supabase.from("staff").select("*").eq("id", id).eq("farm_id", farm.id).maybeSingle(),
    supabase.from("staff_attendance").select("*").eq("staff_id", id).gte("att_date", `${month}-01`).lte("att_date", last).order("att_date", { ascending: false }),
    supabase.from("staff_payments").select("*").eq("staff_id", id).order("paid_on", { ascending: false }).order("created_at", { ascending: false }).limit(60),
  ]);
  const s = staffRes.data;
  if (!s) notFound();
  // Only exceptions are stored; "present" days are not listed (they are the default).
  const attendance = (attRes.data ?? []).filter((a) => a.status !== "present");
  const payments = payRes.data ?? [];
  const monthPayments = payments.filter((p) => p.pay_month === `${month}-01`);
  const p = payroll(
    Number(s.monthly_salary),
    month,
    attendance as { status: AttendanceStatus }[],
    monthPayments as { pay_type: "salary" | "advance" | "bonus"; amount: number }[],
    workDaysSoFar(month, today(), s.join_date),
  );
  const money = (n: number) => f.money(n, farm.currency);
  const modules = moduleChoices(t, farm);

  return (
    <>
      <PageHeader
        title={s.name}
        description={[s.position ? o("staff_position", s.position) : null, s.phone, t(`staff.module.${s.module as "dairy" | "layer" | "both"}`)].filter(Boolean).join(" · ")}
        action={<ButtonLink href="/dashboard/staff" variant="secondary">{t("common.back")}</ButtonLink>}
      />

      <form className="mb-4 flex items-end gap-2">
        <Field label={t("staff.month")}>
          <Input name="month" type="month" defaultValue={month} />
        </Field>
        <button className="rounded-lg border border-stone-300 px-3 py-2 text-sm hover:bg-stone-50">{t("common.load")}</button>
      </form>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label={t("staff.payable")} value={money(p.payable)} hint={p.deduction ? t("staff.deductionHint", { amount: money(p.deduction) }) : t("staff.noDeduction")} />
        <StatCard label={t("staff.paid")} value={money(p.paid)} hint={p.bonus ? t("staff.bonusHint", { amount: money(p.bonus) }) : undefined} />
        <StatCard label={t("staff.balance")} value={money(Math.abs(p.balance))} tone={p.balance > 0 ? "bad" : "good"} hint={p.balance < 0 ? t("staff.paidAhead") : undefined} />
        <StatCard
          label={t("staff.attendanceCount")}
          value={`${f.number(p.present)} / ${f.number(p.absent)} / ${f.number(p.halfDays)}`}
          hint={t("staff.attendanceLegend", { leave: f.number(p.leave) })}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="grid content-start gap-6">
          <Card title={t("staff.paymentsTitle")} description={t("staff.paymentsDesc")}>
            {payments.length === 0 ? (
              <EmptyState title={t("staff.noPayments")} />
            ) : (
              <Table head={[t("staff.colPaidOn"), t("staff.colForMonth"), t("staff.colType"), t("staff.colAmount"), ""]}>
                {payments.map((x) => (
                  <tr key={x.id}>
                    <Td>{f.date(x.paid_on)}</Td>
                    <Td>
                      <Link href={`?month=${x.pay_month.slice(0, 7)}`} className="text-emerald-700 hover:underline">
                        {x.pay_month.slice(0, 7)}
                      </Link>
                    </Td>
                    <Td>
                      <Badge tone={x.pay_type === "salary" ? "green" : x.pay_type === "advance" ? "amber" : "blue"}>{o("staff_pay_type", x.pay_type)}</Badge>
                      {x.note && <span className="block text-xs text-stone-500">{x.note}</span>}
                    </Td>
                    <Td className="tabular-nums">{money(Number(x.amount))}</Td>
                    <Td className="text-right">
                      <ConfirmForm action={deleteStaffPayment} fields={{ id: x.id }} label={t("common.delete")} confirm={t("staff.confirmDeletePayment")} />
                    </Td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>

          <Card title={t("staff.attendanceTitle")} description={t("staff.attendanceDesc")}>
            {attendance.length === 0 ? (
              <EmptyState title={t("staff.noAttendance")}>{t("staff.noAttendanceBody")}</EmptyState>
            ) : (
              <Table head={[t("common.date"), t("staff.colStatus"), t("common.notes")]}>
                {attendance.map((a) => (
                  <ClickRow key={a.id} href={`/dashboard/staff/attendance?date=${a.att_date}`}>
                    <Td>{f.date(a.att_date)}</Td>
                    <Td>
                      <Badge tone={a.status === "present" ? "green" : a.status === "absent" ? "red" : "amber"}>{o("attendance_status", a.status)}</Badge>
                    </Td>
                    <Td>{a.note ?? "—"}</Td>
                  </ClickRow>
                ))}
              </Table>
            )}
          </Card>
        </div>

        <div className="grid content-start gap-6">
          <Card title={t("staff.addPayment")}>
            <ActionForm action={addStaffPayment} submitLabel={t("staff.savePayment")}>
              <input type="hidden" name="staff_id" value={s.id} />
              <div className="grid grid-cols-2 gap-3">
                <Field label={t("staff.colType")}>
                  <Select name="pay_type" options={options("staff_pay_type")} />
                </Field>
                <Field label={t("staff.colAmount")}>
                  <Input name="amount" type="number" min="0.01" step="0.01" inputMode="decimal" defaultValue={p.balance > 0 ? String(p.balance) : ""} required />
                </Field>
                <Field label={t("staff.colForMonth")}>
                  <Input name="pay_month" type="month" defaultValue={month} required />
                </Field>
                <Field label={t("staff.colPaidOn")}>
                  <Input name="paid_on" type="date" defaultValue={today()} max={today()} />
                </Field>
              </div>
              <Field label={t("common.notes")}>
                <Input name="note" />
              </Field>
              <p className="text-xs text-stone-500">{t("staff.paymentHint")}</p>
            </ActionForm>
          </Card>

          <Card title={t("staff.editTitle")}>
            <ActionForm action={updateStaff} submitLabel={t("cattle.saveChanges")}>
              <input type="hidden" name="id" value={s.id} />
              <Field label={t("common.name")}>
                <Input name="name" defaultValue={s.name} required />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t("staff.phone")}>
                  <Input name="phone" type="tel" defaultValue={s.phone ?? ""} />
                </Field>
                <Field label={t("staff.position")}>
                  <Select name="position" defaultValue={s.position ?? ""} options={[{ value: "", label: "—" }, ...options("staff_position", s.position)]} />
                </Field>
                <Field label={t("staff.worksOn")}>
                  <Select name="module" defaultValue={s.module} options={modules.some((m) => m.value === s.module) ? modules : [...modules, { value: s.module, label: t(`staff.module.${s.module as "dairy" | "layer" | "both"}`) }]} />
                </Field>
                <Field label={t("staff.salary", { cur: farm.currency })}>
                  <Input name="monthly_salary" type="number" min="0" step="0.01" inputMode="decimal" defaultValue={s.monthly_salary} required />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="active" defaultChecked={s.active} className="accent-emerald-700" />
                {t("staff.activeLabel")}
              </label>
              <Field label={t("common.notes")}>
                <Textarea name="notes" rows={2} defaultValue={s.notes ?? ""} />
              </Field>
            </ActionForm>
          </Card>
        </div>
      </div>
    </>
  );
}
