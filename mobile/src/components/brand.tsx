import { Image, StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

/** The FarmFlows app icon and name. */
export function Brand({ size = 56, withName = true }: { size?: number; withName?: boolean }) {
  const theme = useTheme();
  return (
    <View style={styles.row} accessibilityRole="header" accessibilityLabel="FarmFlows">
      <Image source={require("../../assets/logo-mark.png")} style={{ width: size, height: size, borderRadius: size * 0.25 }} />
      {withName && (
        <Text variant="headlineSmall" style={[styles.name, { color: theme.colors.onBackground, fontFamily: "Inter_700Bold" }]}>
          farm<Text variant="headlineSmall" style={{ color: theme.colors.primary, fontFamily: "Inter_700Bold" }}>flows</Text>
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  name: { letterSpacing: -0.5 },
});
