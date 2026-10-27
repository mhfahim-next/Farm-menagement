import { StyleSheet, View } from "react-native";
import { Button, Card, Icon, Text, useTheme } from "react-native-paper";
import { useOptions } from "@/lib/data";
import { optionLabel } from "@/lib/options";
import { useOutbox } from "@/lib/outbox";
import type { OutboxEntry } from "@/lib/outbox-core";
import { usePrefs } from "@/lib/prefs";

/** Entries kept on the phone: how many wait, "Send now", and any the server refused. */
export function SyncBar() {
  const { t, date, locale } = usePrefs();
  const theme = useTheme();
  const options = useOptions();
  const { entries, waiting, syncing, sync, discard } = useOutbox();
  const refused = entries.filter((e) => e.error);
  if (!waiting && !refused.length) return null;

  const label = (e: OutboxEntry) =>
    e.kind === "milk"
      ? t("sync.milkLabel", { date: date(e.data.record_date, true), session: optionLabel(options, "milk_session", e.data.session, locale), n: e.data.rows.length })
      : e.kind === "flock"
        ? t("sync.flockLabel", { flock: e.data.flock_name, date: date(e.data.log_date, true) })
        : e.data.label;

  return (
    <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.secondaryContainer }]} testID="sync-bar">
      <Card.Content style={styles.body}>
        {waiting > 0 && (
          <View style={styles.row}>
            <Icon source="cloud-upload-outline" size={22} color={theme.colors.onSecondaryContainer} />
            <Text variant="bodyMedium" style={[styles.flex, { color: theme.colors.onSecondaryContainer }]} testID="sync-waiting">
              {waiting === 1 ? t("sync.waiting_one") : t("sync.waiting", { n: waiting })}
            </Text>
            <Button mode="contained" compact onPress={sync} loading={syncing} disabled={syncing} testID="sync-now">
              {syncing ? t("sync.sending") : t("sync.sendNow")}
            </Button>
          </View>
        )}
        {refused.map((e) => (
          <View key={e.id} style={styles.row}>
            <Icon source="alert-circle-outline" size={22} color={theme.colors.error} />
            <View style={styles.flex}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSecondaryContainer }}>
                {label(e)}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.error }}>
                {t("sync.refused", { error: e.error ?? "" })}
              </Text>
            </View>
            <Button compact onPress={() => discard(e.id)}>
              {t("sync.discard")}
            </Button>
          </View>
        ))}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16 },
  body: { gap: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  flex: { flex: 1 },
});
