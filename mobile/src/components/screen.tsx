import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type ViewStyle } from "react-native";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** A scrolling page with safe-area padding; content stays narrow on tablets and the web. */
export function Screen({ children, footer, contentStyle, testID }: { children: ReactNode; footer?: ReactNode; contentStyle?: ViewStyle; testID?: string }) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: theme.colors.background }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        testID={testID}
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: (footer ? 16 : insets.bottom + 24) }, contentStyle]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inner}>{children}</View>
      </ScrollView>
      {footer && <View style={[styles.footer, { paddingBottom: insets.bottom + 12, backgroundColor: theme.colors.background }]}>{footer}</View>}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 20 },
  inner: { width: "100%", maxWidth: 520, alignSelf: "center", flexGrow: 1 },
  footer: { paddingHorizontal: 20, paddingTop: 8, width: "100%", maxWidth: 560, alignSelf: "center" },
});
