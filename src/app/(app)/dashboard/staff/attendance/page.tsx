import type { Metadata } from "next";
import { ActionForm } from "@/components/action-form";
import { AutoLoad } from "@/components/auto-load";
import { ButtonLink, Card, EmptyState, Field, Input, PageHeader, Select, Table, Td } from "@/components/ui";
import { MANAGERS, requireRole } from "@/lib/auth";
import { today } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { saveAttendance } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("staff.attendanceButton") };
}

export default async function AttendancePage({ searchParams }: PageProps<"/dashboard/staff/attendance">) {
  const { supabase, farm } = await requireRole(MANAGERS);
  const { t, options } = await getI18n();
  const sp = await searchParams;
  const date = typeof sp.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : today();

  const [staffRes, attRes] = await Promise.all([
    supabase.from("staff").select("id, name, position").eq("farm_id", farm.id).eq("active", true).order("name"),
    supabase.from("staff_attendance").select("staff_id, status, note").eq("farm_id", farm.id).eq("att_date", date),
  ]);
  const staff = staffRes.data ?? [];
  const existing = new Map((attRes.data ?? []).map((a) => [a.staff_id, a]));

  return (
    <>
      <PageHeader
        title={t("staff.attendanceButton")}
        description={t("staff.sheetDesc")}
        action={<ButtonLink href="/dashboard/staff" variant="secondary">{t("common.back")}</ButtonLink>}
      />
      <Card className="max-w-3xl">
        {staff.length === 0 ? (
          <EmptyState title={t("staff.emptyTitle")}>{t("staff.emptyBody")}</EmptyState>
        ) : (
          <ActionForm action={saveAttendance} submitLabel={t("staff.saveAttendance")} key={date} successHref="/dashboard/staff">
            <Field label={t("common.date")} className="mb-3">
              <AutoLoad name="att_date" param="date" defaultValue={date} max={today()} />
            </Field>
            <Table head={[t("staff.colName"), t("staff.colStatus"), t("common.notes")]}>
              {staff.map((s) => (
                <tr key={s.id}>
                  <Td>{s.name}</Td>
                  <Td>
                    <Select name={`status_${s.id}`} defaultValue={existing.get(s.id)?.status ?? "present"} options={options("attendance_status")} className="w-36" />
                  </Td>
                  <Td>
                    <Input name={`note_${s.id}`} defaultValue={existing.get(s.id)?.note ?? ""} />
                  </Td>
                </tr>
              ))}
            </Table>
          </ActionForm>
        )}
      </Card>
    </>
  );
}
