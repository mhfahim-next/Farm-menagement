import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import { ChoiceChips, DateField } from "@/components/fields";
import { FormError } from "@/components/form-error";
import { FormScreen } from "@/components/form-screen";
import { useOptions, useStaffMonth } from "@/lib/data";
import { farmToday } from "@/lib/dates";
import { optionLabel } from "@/lib/options";
import { usePrefs } from "@/lib/prefs";
import { useOutbox } from "@/lib/outbox";
import { ATTENDANCE, isDate } from "@/lib/records";
import { useSession } from "@/lib/session";
import type { AttendanceStatus } from "@/lib/staff";
import { useToast } from "@/lib/toast";

/** One day's attendance. Everyone counts as present; mark only who was absent, on half day or on leave. */
export default function AttendanceForm() {
  const { t, n, locale, date: fmt } = usePrefs();
  const theme = useTheme();
  const farm = useSession().current?.farm;
  const options = useOptions();
  const toast = useToast();
  const { save } = useOutbox();
  const [date, setDate] = useState(farmToday());
  const valid = isDate(date);
  const { data } = useStaffMonth(farm?.id, valid ? date.slice(0, 7) : farmToday().slice(0, 7));
  const people = (data?.staff ?? []).filter((s) => s.active && s.join_date <= date);
  // Changes made here, by day and person; anything unchanged shows what is saved.
  const [edits, setEdits] = useState<Record<string, AttendanceStatus>>({});
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const mark = (staffId: string): AttendanceStatus =>
    edits[`${date}|${staffId}`] ?? (data?.attendance ?? []).find((a) => a.att_date === date && a.staff_id === staffId)?.status ?? "present";

  const submit = async () => {
    if (!farm) return;
    if (!valid) return setError(t("rec.err.date"));
    if (date > farmToday()) return setError(t("rec.err.future"));
    if (people.length === 0) return setError(t("staff.nobody"));
    setError(null);
    setBusy(true);
    const saved = (data?.attendance ?? []).filter((a) => a.att_date === date);
    const present = people.filter((s) => mark(s.id) === "present").map((s) => s.id);
    const others = people.filter((s) => mark(s.id) !== "present").map((s) => ({ staff_id: s.id, status: mark(s.id) as string, note: saved.find((a) => a.staff_id === s.id)?.note ?? null }));
    // When each mark was last changed, as shown here (to spot changes made elsewhere meanwhile).
    const seen = Object.fromEntries(people.map((s) => [s.id, saved.find((a) => a.staff_id === s.id)?.updated_at ?? null]));
    const res = await save({ kind: "attendance", farmId: farm.id, data: { date, marks: others, present, seen, label: `${t("staff.attendance")} · ${fmt(date, true)}` } });
    setBusy(false);
    if (res.status === "error") {
      setError(t("common.error"));
      setDetail(res.error);
      return;
    }
    toast(res.status === "queued" ? t("entry.queued") : others.length ? t("staff.marksSaved", { n: n(others.length) }) : t("staff.allPresent"));
    router.back();
  };

  return (
    <FormScreen
      title={t("staff.attendance")}
      testID="attendance-form"
      footer={
        <>
          <FormError message={error} detail={detail} />
          <Button mode="contained" icon="content-save-outline" onPress={submit} loading={busy} disabled={busy} contentStyle={{ height: 50 }} testID="attendance-save">
            {t("rec.save")}
          </Button>
        </>
      }
    >
      <DateField value={date} onChange={setDate} />
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
        {t("staff.attendanceHint")}
      </Text>
      {people.map((s) => (
        <View key={s.id} style={{ gap: 6 }}>
          <Text variant="titleSmall">{s.name}</Text>
          <ChoiceChips
            options={ATTENDANCE.map((a) => ({ value: a, label: optionLabel(options ?? null, "attendance_status", a, locale) }))}
            value={mark(s.id)}
            onChange={(v) => setEdits((m) => ({ ...m, [`${date}|${s.id}`]: v as AttendanceStatus }))}
            testID={`att-${s.name}`}
          />
        </View>
      ))}
    </FormScreen>
  );
}
