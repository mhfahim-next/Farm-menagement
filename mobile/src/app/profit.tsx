import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Button, Card, Divider, SegmentedButtons, Text, useTheme } from "react-native-paper";
import { OfflineNote } from "@/components/offline-note";
import { useCached } from "@/lib/cache";
import { fetchLedger } from "@/lib/data";
import { farmToday } from "@/lib/dates";
import { usePrefs } from "@/lib/prefs";
import { monthRange, profitBy } from "@/lib/records";
import { useSession } from "@/lib/session";

/** This month's (or last month's) money in, costs and profit, for each part of the farm. */
export default function Profit() {
  const { t, money, date } = usePrefs();
  const theme = useTheme();
  const farm = useSession().current?.farm;
  const currency = farm?.currency ?? "BDT";
  const [which, setWhich] = useState<"this" | "last">("this");
  const range = monthRange(farmToday(), which);
  const ledger = useCached(farm ? `ledger.${farm.id}.${range.from}` : null, () => fetchLedger(farm!.id, range.from, range.to));
  const { reload } = ledger;
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );
  const p = profitBy(ledger.data ?? []);
  const back = () => (router.canGoBack() ? router.back() : router.replace("/sales"));
  const good = p.total.profit >= 0;

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]} testID="profit">
      <Appbar.Header mode="small" elevated={false}>
        <Appbar.BackAction onPress={back} accessibilityLabel={t("animal.back")} />
        <Appbar.Content title={t("profit.title")} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inner}>
          <SegmentedButtons
            value={which}
            onValueChange={(v) => setWhich(v as "this" | "last")}
            buttons={[
              { value: "this", label: t("profit.thisMonth"), testID: "month-this" },
              { value: "last", label: t("profit.lastMonth"), testID: "month-last" },
            ]}
          />
          <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: "center" }}>
            {`${date(range.from)} – ${date(range.to)}`}
          </Text>
          {ledger.offline && <OfflineNote />}
          <Card mode="contained" style={[styles.card, { backgroundColor: good ? theme.colors.primaryContainer : theme.colors.errorContainer }]}>
            <Card.Content style={styles.gap}>
              <Text variant="labelLarge">{good ? t("profit.profit") : t("profit.loss")}</Text>
              <Text variant="headlineMedium" testID="profit-total">
                {money(Math.abs(p.total.profit), currency)}
              </Text>
              <View style={styles.row}>
                <Text variant="bodyMedium">{t("profit.income", { amount: money(p.total.income, currency) })}</Text>
                <Text variant="bodyMedium">{t("profit.cost", { amount: money(p.total.cost, currency) })}</Text>
              </View>
            </Card.Content>
          </Card>
          {p.sections.length > 0 && (
            <Card mode="outlined" style={styles.card}>
              {p.sections.map((s, i) => (
                <View key={s.module}>
                  {i > 0 && <Divider />}
                  <View style={styles.line} testID={`profit-${s.module}`}>
                    <View style={styles.flex}>
                      <Text variant="titleSmall">{t(`section.${s.module}` as "section.general")}</Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {`${t("profit.income", { amount: money(s.income, currency) })} · ${t("profit.cost", { amount: money(s.cost, currency) })}`}
                      </Text>
                    </View>
                    <Text variant="titleSmall" style={{ color: s.profit >= 0 ? theme.colors.primary : theme.colors.error }}>
                      {`${s.profit < 0 ? "−" : ""}${money(Math.abs(s.profit), currency)}`}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          )}
          {ledger.data && p.sections.length === 0 && <Text style={{ textAlign: "center", color: theme.colors.onSurfaceVariant }}>{t("profit.empty")}</Text>}
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {t("profit.note")}
          </Text>
          <Button mode="contained-tonal" icon="cash-minus" onPress={() => router.push("/record/expense")} testID="profit-add-expense">
            {t("txn.title")}
          </Button>
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
  gap: { gap: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginTop: 4 },
  line: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
});
