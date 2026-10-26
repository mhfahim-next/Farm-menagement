import { StyleSheet, View } from "react-native";
import { Icon, Text, useTheme } from "react-native-paper";

/** A clear error box under a form (read by screen readers). */
export function FormError({ message }: { message: string | null }) {
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
      <Text variant="bodyMedium" style={{ color: theme.colors.onErrorContainer, flex: 1 }}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: "row", gap: 10, alignItems: "center", padding: 12, borderRadius: 12, marginTop: 4 },
});
