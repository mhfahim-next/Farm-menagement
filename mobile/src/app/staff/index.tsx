import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Button, Card, FAB, List, Text, useTheme } from "react-native-paper";
import { OfflineNote } from "@/components/offline-note";
import { useOptions, useStaffMonth } from "@/lib/data";
import { farmToday } from "@/lib/dates";
import { optionLabel } from "@/lib/options";
import { usePrefs } from "@/lib/prefs";
import { useSession } from "@/lib/session";
import { payroll, workDaysSoFar } from "@/lib/staff";

/** Farm workers: today's attendance, this month's salary and what is still due. */
export default function Staff() {
  const { t, money, n, month: monthName, locale } = usePrefs();
  const theme = useTheme();
  const { current } = useSession();
  const currency = current?.farm.currency ?? "BDT";
  const today = farmToday();
  const month = today.slice(0, 7);
  const options = useOptions();
  const { data, offline, reload } = useStaffMonth(current?.farm.id, month);
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );
  const rows = (data?.staff ?? []).map((s) => ({
    s,
    p: payroll(
      Number(s.monthly_salary),
      month,
      (data?.attendance ?? []).filter((a) => a.staff_id === s.id),
      (data?.payments ?? []).filter((x) => x.staff_id === s.id),
      workDaysSoFar(month, today, s.join_date),
    ),
    todayMark: (data?.attendance ?? []).find((a) => a.staff_id === s.id && a.att_date === today)?.status,
  }));
  const active = rows.filter((r) => r.s.active);
  const due = active.reduce((sum, r) => sum + Math.max(0, r.p.balance), 0);
  const back = () => (router.canGoBack() ? router.back() : router.replace("/more"));

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]} testID="staff">
      <Appbar.Header mode="small" elevated={false}>
        <Appbar.BackAction onPress={back} accessibilityLabel={t("animal.back")} />
        <Appbar.Content title={t("staff.title")} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inner}>
          {offline && <OfflineNote />}
          <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.primaryContainer }]}>
            <Card.Content style={{ gap: 4 }}>
              <Text variant="labelLarge">{monthName(month)}</Text>
              <Text variant="bodyLarge">{t("staff.activeN", { n: n(active.length) })}</Text>
              <Text variant="bodyMedium">{t("staff.bill", { amount: money(active.reduce((s, r) => s + Number(r.s.monthly_salary), 0), currency) })}</Text>
              <Text variant="bodyMedium">{t("staff.paidMonth", { amount: money(active.reduce((s, r) => s + r.p.paid + r.p.bonus, 0), currency) })}</Text>
              <Text variant="titleMedium" style={{ color: due > 0 ? theme.colors.error : theme.colors.onPrimaryContainer }} testID="staff-due">
                {t("staff.dueMonth", { amount: money(due, currency) })}
              </Text>
            </Card.Content>
          </Card>
          {active.length > 0 && (
            <Button mode="contained-tonal" icon="calendar-check-outline" onPress={() => router.push("/staff/attendance")} testID="open-attendance">
              {t("staff.attendance")}
            </Button>
          )}
          {data && rows.length === 0 && <Text style={{ textAlign: "center", marginTop: 24, color: theme.colors.onSurfaceVariant }}>{t("staff.empty")}</Text>}
          {rows.map(({ s, p, todayMark }) => (
            <List.Item
              key={s.id}
              title={s.name}
              description={[
                s.position ? optionLabel(options ?? null, "staff_position", s.position, locale) : "",
                s.active ? (todayMark && todayMark !== "present" ? optionLabel(options ?? null, "attendance_status", todayMark, locale) : s.join_date <= today ? t("staff.presentToday") : "") : t("staff.inactive"),
              ]
                .filter(Boolean)
                .join(" · ")}
              onPress={() => router.push({ pathname: "/staff/[id]", params: { id: s.id } })}
              left={(pp) => <List.Icon {...pp} icon="account-hard-hat-outline" color={todayMark === "absent" ? theme.colors.error : pp.color} />}
              right={() =>
                s.active ? (
                  <Text variant="titleSmall" style={[styles.center, { color: p.balance > 0 ? theme.colors.error : theme.colors.onSurface }]}>
                    {money(Math.max(0, p.balance), currency)}
                  </Text>
                ) : null
              }
              style={[styles.item, { backgroundColor: theme.colors.elevation.level1, opacity: s.active ? 1 : 0.6 }]}
              testID={`staff-row-${s.name}`}
            />
          ))}
        </View>
      </ScrollView>
      <FAB icon="plus" label={t("staff.add")} style={styles.fab} onPress={() => router.push("/record/staff")} testID="add-staff" />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 96 },
  inner: { width: "100%", maxWidth: 720, alignSelf: "center", gap: 8 },
  card: { borderRadius: 20 },
  item: { borderRadius: 16 },
  center: { alignSelf: "center" },
  fab: { position: "absolute", right: 16, bottom: 16 },
});
