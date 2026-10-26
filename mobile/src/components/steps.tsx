import { StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";

/** "Step 1 of 2" progress at the top of the setup screens. */
export function Steps({ step, of = 2 }: { step: number; of?: number }) {
  const theme = useTheme();
  return (
    <View style={styles.steps} accessibilityLabel={`${step} / ${of}`}>
      {Array.from({ length: of }, (_, i) => (
        <View key={i} style={[styles.step, { backgroundColor: i < step ? theme.colors.primary : theme.colors.surfaceVariant }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  steps: { flexDirection: "row", gap: 6, marginBottom: 20 },
  step: { flex: 1, height: 4, borderRadius: 2 },
});
