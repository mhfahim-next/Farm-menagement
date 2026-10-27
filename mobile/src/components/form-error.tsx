import { StyleSheet, View } from "react-native";
import { Icon, Text, useTheme } from "react-native-paper";

/**
 * A clear error box under a form (read by screen readers). `detail` is the
 * server's own words, shown small when the cause isn't one we explain.
 */
export function FormError({ message, detail }: { message: string | null; detail?: string | null }) {
  const theme = useTheme();
  if (!message) return null;
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      testID="form-error"
      style={[styles.box, { backgroundColor: theme.colors.errorContainer }]}
    >
      <Icon source="alert-circle-outline" size={20} color={theme.colors.onErrorContainer} />
      <View style={styles.flex}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onErrorContainer }}>
          {message}
        </Text>
        {detail ? (
          <Text variant="bodySmall" selectable style={{ color: theme.colors.onErrorContainer, opacity: 0.8 }} testID="form-error-detail">
            {detail}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  box: { flexDirection: "row", gap: 10, alignItems: "center", padding: 12, borderRadius: 12, marginTop: 4 },
});
