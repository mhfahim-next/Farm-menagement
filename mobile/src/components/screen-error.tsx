import { router, type ErrorBoundaryProps } from "expo-router";
import { Pressable, StyleSheet, Text, View, useColorScheme } from "react-native";
import { isLocale, translate } from "@/lib/i18n/core";
import { getItem, KEYS } from "@/lib/storage";

/**
 * Shown instead of closing the app when a screen fails. It sits outside the
 * app's providers, so it uses plain views and reads the language itself.
 */
export function ScreenError({ error, retry }: ErrorBoundaryProps) {
  const saved = getItem(KEYS.locale);
  const locale = saved && isLocale(saved) ? saved : "bn";
  const dark = useColorScheme() === "dark";
  const fg = dark ? "#e2e3dd" : "#1a1c19";
  return (
    <View style={[styles.box, { backgroundColor: dark ? "#111411" : "#f6fbf3" }]} accessibilityRole="alert" testID="screen-error">
      <Text style={[styles.title, { color: fg }]}>{translate(locale, "crash.title")}</Text>
      <Text style={[styles.body, { color: fg }]}>{translate(locale, "crash.body")}</Text>
      <Text style={[styles.detail, { color: dark ? "#8c9388" : "#5c6359" }]} numberOfLines={3}>
        {error.message}
      </Text>
      <Pressable onPress={retry} style={styles.button} accessibilityRole="button" testID="screen-error-retry">
        <Text style={styles.buttonText}>{translate(locale, "common.retry")}</Text>
      </Pressable>
      <Pressable
        onPress={() => {
          router.replace("/");
          void retry();
        }}
        style={styles.link}
        accessibilityRole="button"
        testID="screen-error-home"
      >
        <Text style={[styles.linkText, { color: dark ? "#6fdba8" : "#006c49" }]}>{translate(locale, "tabs.home")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  title: { fontSize: 22, fontWeight: "700", textAlign: "center" },
  body: { fontSize: 16, textAlign: "center" },
  detail: { fontSize: 12, textAlign: "center" },
  button: { marginTop: 12, backgroundColor: "#006c49", borderRadius: 999, paddingHorizontal: 28, paddingVertical: 12 },
  buttonText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
  link: { paddingHorizontal: 20, paddingVertical: 10 },
  linkText: { fontSize: 16, fontWeight: "600" },
});
