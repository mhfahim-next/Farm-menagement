import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Linking, ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Button, Card, List, Text, useTheme } from "react-native-paper";
import { OfflineNote } from "@/components/offline-note";
import { addMonths, monthBill, monthBounds } from "@/lib/bill";
import { billHtml, billText, whatsappLink } from "@/lib/bill-doc";
import { useCached } from "@/lib/cache";
import { fetchBuyerUntil, useBuyers } from "@/lib/data";
import { farmToday } from "@/lib/dates";
import type { MessageKey } from "@/lib/i18n/en";
import { usePrefs } from "@/lib/prefs";
import { useSession } from "@/lib/session";
import { sharePdf } from "@/lib/share";
import { useToast } from "@/lib/toast";

/** A buyer's bill for one month: owed at the start, each sale and payment, owed at the end. Share as PDF or WhatsApp. */
export default function BuyerBillScreen() {
  const { id, month: asked } = useLocalSearchParams<{ id: string; month?: string }>();
  const prefs = usePrefs();
  const { t, n, money, date, month: monthName } = prefs;
  const theme = useTheme();
  const toast = useToast();
  const farm = useSession().current?.farm;
  const currency = farm?.currency ?? "BDT";
  const [month, setMonth] = useState(asked && monthBounds(asked) ? asked : farmToday().slice(0, 7));
  const { to } = monthBounds(month)!;
  const buyers = useBuyers(farm?.id);
  const data = useCached(farm && id ? `bill.${id}.${month}` : null, () => fetchBuyerUntil(farm!.id, id, to));
  const buyer = (buyers.data ?? []).find((b) => b.id === id);
  const bill = data.data ? monthBill(data.data.sales, data.data.payments, month) : null;
  const label = monthName(`${month}-01`);
  const fmt = { t, n, money, date: (d: string | null | undefined) => date(d) };
  const doc = farm && buyer && bill ? { farm: { name: farm.name, location: farm.location, currency }, buyer: { name: buyer.name, phone: buyer.phone, due: buyer.due } } : null;
  const back = () => (router.canGoBack() ? router.back() : router.replace(`/buyer/${id}`));
  const sharePdfNow = async () => {
    if (!doc || !bill) return;
    try {
      await sharePdf(`bill-${buyer!.name.replace(/[^\p{L}\p{N}]+/gu, "-")}-${month}.pdf`, billHtml(bill, label, doc.farm, doc.buyer, fmt));
    } catch (e) {
      toast(`${t("common.error")} ${e instanceof Error ? e.message : ""}`);
    }
  };

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]} testID="bill-screen">
      <Appbar.Header mode="small" elevated={false}>
        <Appbar.BackAction onPress={back} accessibilityLabel={t("animal.back")} />
        <Appbar.Content title={`${t("bill.title")} · ${buyer?.name ?? ""}`} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inner}>
          {data.offline && <OfflineNote />}
          <View style={styles.row}>
            <Button icon="chevron-left" onPress={() => setMonth(addMonths(month, -1))} testID="bill-prev">
              {t("bill.prev")}
            </Button>
            <Text variant="titleMedium" style={styles.center} testID="bill-month">
              {label}
            </Text>
            <Button icon="chevron-right" contentStyle={{ flexDirection: "row-reverse" }} onPress={() => setMonth(addMonths(month, 1))} testID="bill-next">
              {t("bill.next")}
            </Button>
          </View>
          {bill && (
            <>
              <Card mode="contained" style={[styles.card, { backgroundColor: bill.closing > 0 ? theme.colors.errorContainer : theme.colors.primaryContainer }]}>
                <Card.Content style={{ gap: 4 }}>
                  {bill.products.map((p) => (
                    <Text key={`${p.product}-${p.unit}`} variant="bodyMedium">{`${t(`product.${p.product}` as MessageKey)}: ${n(p.quantity, 2)} ${t(`unit.${p.unit}` as MessageKey)} = ${money(p.amount, currency)}`}</Text>
                  ))}
                  <Line k={t("bill.opening")} v={money(bill.opening, currency)} />
                  <Line k={t("bill.monthSales")} v={money(bill.totalSales, currency)} testID="bill-sales" />
                  <Line k={t("bill.monthPaid")} v={money(bill.paid, currency)} testID="bill-paid" />
                  <Line k={t("bill.closing")} v={money(bill.closing, currency)} bold testID="bill-closing" />
                </Card.Content>
              </Card>
              <View style={styles.row}>
                <Button mode="contained" icon="file-pdf-box" style={styles.flex} contentStyle={styles.btn} onPress={sharePdfNow} testID="bill-pdf">
                  {t("bill.sharePdf")}
                </Button>
                <Button
                  mode="contained-tonal"
                  icon="whatsapp"
                  style={styles.flex}
                  contentStyle={styles.btn}
                  onPress={() => doc && Linking.openURL(whatsappLink(buyer?.phone, billText(bill, label, doc.farm, doc.buyer, fmt)))}
                  testID="bill-whatsapp"
                >
                  {t("bill.whatsapp")}
                </Button>
              </View>
              {bill.lines.length === 0 ? (
                <Text style={{ color: theme.colors.onSurfaceVariant }}>{t("bill.nothing")}</Text>
              ) : (
                bill.lines.map((l, i) => (
                  <List.Item
                    key={i}
                    title={
                      l.kind === "sale"
                        ? `${t(`product.${l.sale.product}` as MessageKey)} · ${n(Number(l.sale.quantity), 2)} ${t(`unit.${l.sale.unit}` as MessageKey)}`
                        : `${t("sale.payment")} · ${t(`pay.${l.payment.method}` as MessageKey)}`
                    }
                    description={`${date(l.date)} · ${t("bill.balance")} ${money(l.balance, currency)}`}
                    right={() => (
                      <Text variant="titleSmall" style={[styles.center, { color: l.kind === "payment" ? theme.colors.primary : theme.colors.onSurface }]}>
                        {l.kind === "sale" ? money(Number(l.sale.amount), currency) : `−${money(Number(l.payment.amount), currency)}`}
                      </Text>
                    )}
                  />
                ))
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function Line({ k, v, bold, testID }: { k: string; v: string; bold?: boolean; testID?: string }) {
  return (
    <View style={styles.row}>
      <Text variant={bold ? "titleMedium" : "bodyMedium"} style={styles.flex}>
        {k}
      </Text>
      <Text variant={bold ? "titleMedium" : "titleSmall"} testID={testID}>
        {v}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  inner: { width: "100%", maxWidth: 720, alignSelf: "center", gap: 10 },
  card: { borderRadius: 20 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  btn: { height: 48 },
  center: { alignSelf: "center", textAlign: "center", flex: 1 },
});
