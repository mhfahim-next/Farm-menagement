import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

/** A small bar chart, one bar per day; the highest day fills the height. */
export function BarChart({ data, label, startLabel, endLabel, testID }: { data: { date: string; value: number }[]; label: string; startLabel: string; endLabel: string; testID?: string }) {
  const theme = useTheme();
  const max = Math.max(0, ...data.map((d) => d.value));
  return (
    <View accessible accessibilityLabel={label} testID={testID}>
      <View style={styles.bars}>
        {data.map((d) => (
          <View key={d.date} style={styles.slot}>
            <View
              style={{
                height: max > 0 ? `${Math.max(d.value > 0 ? 3 : 0, (d.value / max) * 100)}%` : 0,
                backgroundColor: d.value > 0 ? theme.colors.primary : "transparent",
                borderTopLeftRadius: 3,
                borderTopRightRadius: 3,
              }}
            />
          </View>
        ))}
      </View>
      <View style={[styles.axis, { borderTopColor: theme.colors.outlineVariant }]}>
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {startLabel}
        </Text>
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {endLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bars: { height: 96, flexDirection: "row", alignItems: "flex-end", gap: 2 },
  slot: { flex: 1, height: "100%", justifyContent: "flex-end" },
  axis: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 4 },
});
