import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Button, Icon, Text, useTheme } from "react-native-paper";
import { usePrefs } from "@/lib/prefs";

export type NextStep = { label: string; icon: string; go: () => void; testID: string };

/** After saving: what was saved, and the next thing to write. */
export function EntryDone({ title, body, queued, next }: { title: string; body: string; queued: boolean; next: NextStep[] }) {
  const { t } = usePrefs();
  const theme = useTheme();
  return (
    <View style={styles.box} testID="entry-done">
      <Icon source={queued ? "cloud-upload-outline" : "check-circle"} size={72} color={queued ? theme.colors.tertiary : theme.colors.primary} />
      <Text variant="headlineSmall" style={styles.center} testID="entry-done-title">
        {title}
      </Text>
      <Text variant="bodyLarge" style={[styles.center, { color: theme.colors.onSurfaceVariant }]}>
        {body}
      </Text>
      {queued && (
        <Text variant="bodyMedium" style={[styles.center, { color: theme.colors.tertiary }]}>
          {t("entry.queued")}
        </Text>
      )}
      <View style={styles.actions}>
        {next.map((n) => (
          <Button key={n.testID} mode="contained-tonal" icon={n.icon} onPress={n.go} contentStyle={styles.btn} testID={n.testID}>
            {n.label}
          </Button>
        ))}
        <Button mode="text" onPress={() => (router.canGoBack() ? router.back() : router.replace("/entry"))} testID="entry-done-close">
          {t("hub.done")}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  center: { textAlign: "center" },
  actions: { alignSelf: "stretch", gap: 10, marginTop: 16, maxWidth: 420, width: "100%", marginHorizontal: "auto" },
  btn: { height: 48 },
});
