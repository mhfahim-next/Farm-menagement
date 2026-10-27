import { router } from "expo-router";
import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Appbar, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePrefs } from "@/lib/prefs";

/** A page with a back arrow and title, scrolling content and a button bar at the bottom. */
export function FormScreen({ title, children, footer, testID }: { title: string; children: ReactNode; footer?: ReactNode; testID?: string }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = usePrefs();
  const back = () => (router.canGoBack() ? router.back() : router.replace("/"));
  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: theme.colors.background }]} behavior={Platform.OS === "ios" ? "padding" : undefined} testID={testID}>
      <Appbar.Header mode="small" elevated={false}>
        <Appbar.BackAction onPress={back} accessibilityLabel={t("animal.back")} testID="form-back" />
        <Appbar.Content title={title} />
      </Appbar.Header>
      <ScrollView style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.inner}>{children}</View>
      </ScrollView>
      {footer ? <View style={[styles.footer, { paddingBottom: insets.bottom + 12, borderTopColor: theme.colors.outlineVariant }]}>{footer}</View> : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 24 },
  inner: { width: "100%", maxWidth: 640, alignSelf: "center", gap: 12 },
  footer: { paddingHorizontal: 16, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, gap: 8, width: "100%", maxWidth: 672, alignSelf: "center" },
});
