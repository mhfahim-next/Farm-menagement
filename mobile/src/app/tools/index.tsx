import { router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { Appbar, List, Text, useTheme } from "react-native-paper";
import { usePrefs } from "@/lib/prefs";
import { TOOLS, toolName, toolShort } from "@/lib/tool-list";

/** Farm calculators: weight from a tape, feed ration, poultry feed, calving date and more. */
export default function Tools() {
  const { t } = usePrefs();
  const theme = useTheme();
  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]} testID="tools">
      <Appbar.Header mode="small" elevated={false}>
        <Appbar.BackAction onPress={() => (router.canGoBack() ? router.back() : router.replace("/more"))} accessibilityLabel={t("animal.back")} />
        <Appbar.Content title={t("tools.title")} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inner}>
          {TOOLS.map((tool) => (
            <List.Item
              key={tool.slug}
              title={t(toolName(tool.key))}
              description={t(toolShort(tool.key))}
              descriptionNumberOfLines={2}
              left={(p) => <List.Icon {...p} icon={tool.icon} color={theme.colors.primary} />}
              right={(p) => <List.Icon {...p} icon="chevron-right" />}
              onPress={() => router.push({ pathname: "/tools/[slug]", params: { slug: tool.slug } })}
              style={[styles.item, { backgroundColor: theme.colors.elevation.level1 }]}
              testID={`tool-${tool.slug}`}
            />
          ))}
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
            {t("tools.estimate")}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  inner: { width: "100%", maxWidth: 720, alignSelf: "center", gap: 8 },
  item: { borderRadius: 16 },
});
