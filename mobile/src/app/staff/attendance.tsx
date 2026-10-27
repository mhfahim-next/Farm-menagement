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
import { ATTENDANCE, isDate } from "@/lib/records";
import { useSession } from "@/lib/session";
import type { AttendanceStatus } from "@/lib/staff";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/lib/toast";

/** One day's attendance. Everyone counts as present; mark only who was absent, on half day or on leave. */
export default function AttendanceForm() {
  const { t, n, locale } = usePrefs();
  const theme = useTheme();
  const farm = useSession().current?.farm;
  const options = useOptions();
  const toast = useToast();
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
    const present = people.filter((s) => mark(s.id) === "present").map((s) => s.id);
    const others = people.filter((s) => mark(s.id) !== "present").map((s) => ({ farm_id: farm.id, staff_id: s.id, att_date: date, status: mark(s.id) }));
    const del = present.length ? await supabase.from("staff_attendance").delete().eq("farm_id", farm.id).eq("att_date", date).in("staff_id", present) : { error: null };
    const up = !del.error && others.length ? await supabase.from("staff_attendance").upsert(others, { onConflict: "staff_id,att_date" }) : { error: null };
    setBusy(false);
    const e = del.error ?? up.error;
    if (e) {
      setError(t("common.error"));
      setDetail(e.message);
      return;
    }
    toast(others.length ? t("staff.marksSaved", { n: n(others.length) }) : t("staff.allPresent"));
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
