import { router, useLocalSearchParams } from "expo-router";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Text, useTheme } from "react-native-paper";
import { FarmTool } from "@/components/farm-tools";
import { usePrefs } from "@/lib/prefs";
import { toolBySlug, toolName, toolShort } from "@/lib/tool-list";

/** One farm calculator. */
export default function ToolScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t } = usePrefs();
  const theme = useTheme();
  const tool = toolBySlug(slug ?? "");
  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: theme.colors.background }]} behavior={Platform.OS === "ios" ? "padding" : undefined} testID={`tool-screen-${slug}`}>
      <Appbar.Header mode="small" elevated={false}>
        <Appbar.BackAction onPress={() => (router.canGoBack() ? router.back() : router.replace("/tools"))} accessibilityLabel={t("animal.back")} />
        <Appbar.Content title={tool ? t(toolName(tool.key)) : t("tools.title")} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.inner}>
          {tool && (
            <>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {t(toolShort(tool.key))}
              </Text>
              <FarmTool slug={tool.slug} />
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {t("tools.estimate")}
              </Text>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 48 },
  inner: { width: "100%", maxWidth: 720, alignSelf: "center", gap: 12 },
});
