import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Button, Card, IconButton, List, Text, useTheme } from "react-native-paper";
import { RecordMenu } from "@/components/record-menu";
import { useOptions, useStaffMonth } from "@/lib/data";
import { farmToday } from "@/lib/dates";
import { optionLabel } from "@/lib/options";
import { usePrefs } from "@/lib/prefs";
import { shiftMonth } from "@/lib/records";
import { useSession } from "@/lib/session";
import { payroll, workDaysSoFar } from "@/lib/staff";
import { useRemove } from "@/lib/outbox";
import { useToast } from "@/lib/toast";

/** One worker: a month's attendance and salary, and the payments made. */
export default function StaffMemberPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, n, money, date, month: monthName, locale } = usePrefs();
  const theme = useTheme();
  const { current } = useSession();
  const currency = current?.farm.currency ?? "BDT";
  const options = useOptions();
  const toast = useToast();
  const remove = useRemove();
  const today = farmToday();
  const [month, setMonth] = useState(today.slice(0, 7));
  const { data, reload } = useStaffMonth(current?.farm.id, month);
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );
  const s = (data?.staff ?? []).find((x) => x.id === id);
  const marks = (data?.attendance ?? []).filter((a) => a.staff_id === id).sort((a, b) => b.att_date.localeCompare(a.att_date));
  const pays = (data?.payments ?? []).filter((x) => x.staff_id === id);
  const p = s ? payroll(Number(s.monthly_salary), month, marks, pays, workDaysSoFar(month, today, s.join_date)) : null;
  const back = () => (router.canGoBack() ? router.back() : router.replace("/staff"));
  const line = (label: string, value: string, strong = false, testID?: string) => (
    <View style={styles.line}>
      <Text variant={strong ? "titleMedium" : "bodyMedium"}>{label}</Text>
      <Text variant={strong ? "titleMedium" : "bodyMedium"} testID={testID}>
        {value}
      </Text>
    </View>
  );

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]} testID="staff-member">
      <Appbar.Header mode="small" elevated={false}>
        <Appbar.BackAction onPress={back} accessibilityLabel={t("animal.back")} />
        <Appbar.Content title={s?.name ?? ""} />
        {s ? <Appbar.Action icon="pencil-outline" onPress={() => router.push({ pathname: "/record/staff", params: { id } })} accessibilityLabel={t("rec.edit")} testID="staff-edit" /> : null}
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inner}>
          {s && p && (
            <>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {[s.position ? optionLabel(options ?? null, "staff_position", s.position, locale) : "", t(`staff.sec.${s.module}` as "staff.sec.both"), s.phone ?? "", t("staff.joined", { date: date(s.join_date) })]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
              <View style={styles.monthRow}>
                <IconButton icon="chevron-left" onPress={() => setMonth(shiftMonth(month, -1))} accessibilityLabel={t("staff.prevMonth")} testID="month-prev" />
                <Text variant="titleMedium" testID="staff-month">
                  {monthName(month)}
                </Text>
                <IconButton icon="chevron-right" disabled={month >= today.slice(0, 7)} onPress={() => setMonth(shiftMonth(month, 1))} accessibilityLabel={t("staff.nextMonth")} testID="month-next" />
              </View>
              <Card mode="outlined" style={styles.card}>
                <Card.Content style={{ gap: 6 }}>
                  {line(t("staff.salary"), money(Number(s.monthly_salary), currency))}
                  {line(t("staff.days"), t("staff.daysLine", { present: n(p.present), absent: n(p.absent), half: n(p.halfDays), leave: n(p.leave) }))}
                  {p.deduction > 0 && line(t("staff.deduction"), `− ${money(p.deduction, currency)}`)}
                  {line(t("staff.payable"), money(p.payable, currency))}
                  {line(t("staff.paid"), money(p.paid, currency))}
                  {p.bonus > 0 && line(t("staff.bonus"), money(p.bonus, currency))}
                  {line(p.balance >= 0 ? t("staff.due") : t("staff.ahead"), money(Math.abs(p.balance), currency), true, "staff-balance")}
                </Card.Content>
              </Card>
              <Button mode="contained" icon="cash-plus" onPress={() => router.push({ pathname: "/record/staff-pay", params: { staff: id, month, amount: p.balance > 0 ? String(p.balance) : "" } })} testID="staff-pay">
                {t("staff.pay")}
              </Button>
              <Card mode="outlined" style={styles.card}>
                <Card.Title title={t("staff.payments")} titleVariant="titleMedium" />
                {pays.length === 0 ? (
                  <Card.Content>
                    <Text style={{ color: theme.colors.onSurfaceVariant }}>{t("staff.noPayments")}</Text>
                  </Card.Content>
                ) : (
                  pays.map((x) => (
                    <List.Item
                      key={x.id}
                      title={`${t(`staff.type.${x.pay_type}`)} · ${money(Number(x.amount), currency)}`}
                      description={[date(x.paid_on), x.note ?? ""].filter(Boolean).join(" · ")}
                      left={(pp) => <List.Icon {...pp} icon="cash" />}
                      right={() => (
                        <RecordMenu
                          onDelete={async () => {
                            const r = await remove("staff_payments", x.id, `${t("rec.delete")} · ${money(Number(x.amount), currency)}`);
                            toast(r.error ? `${t("common.error")} ${r.error}` : r.queued ? t("entry.queued") : t("rec.deleted"));
                            reload();
                          }}
                        />
                      )}
                    />
                  ))
                )}
              </Card>
              {marks.length > 0 && (
                <Card mode="outlined" style={styles.card}>
                  <Card.Title title={t("staff.marks")} titleVariant="titleMedium" />
                  {marks.map((m) => (
                    <List.Item key={m.att_date} title={optionLabel(options ?? null, "attendance_status", m.status, locale)} description={[date(m.att_date), m.note ?? ""].filter(Boolean).join(" · ")} />
                  ))}
                </Card>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  inner: { width: "100%", maxWidth: 720, alignSelf: "center", gap: 12 },
  card: { borderRadius: 20 },
  line: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  monthRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
});
