import { StyleSheet, View } from "react-native";
import { Icon, Text, useTheme } from "react-native-paper";
import { usePrefs } from "@/lib/prefs";

/** "No internet, showing what was last loaded." */
export function OfflineNote() {
  const { t } = usePrefs();
  const theme = useTheme();
  return (
    <View style={[styles.box, { backgroundColor: theme.colors.surfaceVariant }]} testID="offline-note" accessibilityLiveRegion="polite">
      <Icon source="wifi-off" size={18} color={theme.colors.onSurfaceVariant} />
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}>
        {t("common.offline")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: "row", gap: 8, alignItems: "center", padding: 10, borderRadius: 12 },
});
