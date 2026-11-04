import { router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Card, Chip, Text, useTheme } from "react-native-paper";
import { RELEASES, UPCOMING } from "@/lib/changelog";
import { usePrefs } from "@/lib/prefs";

/** What's new and what's coming (the same list as the website's /changelog, built into the app). */
export default function ChangelogScreen() {
  const { t, locale, date } = usePrefs();
  const theme = useTheme();
  const pick = (b: { en: string; bn: string }) => (locale === "bn" ? b.bn : b.en);
  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]} testID="changelog-screen">
      <Appbar.Header mode="small" elevated={false}>
        <Appbar.BackAction onPress={() => (router.canGoBack() ? router.back() : router.replace("/more"))} accessibilityLabel={t("animal.back")} />
        <Appbar.Content title={t("changelog.nav")} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inner}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {t("changelog.desc")}
          </Text>
          <Text variant="titleLarge" style={styles.h}>
            {t("changelog.comingTitle")}
          </Text>
          {UPCOMING.map((u, i) => (
            <Card key={i} mode="outlined" style={styles.card}>
              <Card.Content style={{ gap: 6, paddingVertical: 12 }}>
                <Chip compact style={{ alignSelf: "flex-start" }}>
                  {t(`changelog.status.${u.status}`)}
                </Chip>
                <Text variant="titleSmall">{pick(u.title)}</Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  {pick(u.body)}
                </Text>
              </Card.Content>
            </Card>
          ))}
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {t("changelog.comingNote")}
          </Text>
          <Text variant="titleLarge" style={styles.h}>
            {t("changelog.releasedTitle")}
          </Text>
          {RELEASES.map((r) => (
            <Card key={r.id} mode="contained" style={[styles.card, { backgroundColor: theme.colors.elevation.level2 }]} testID={`release-${r.id}`}>
              <Card.Content style={{ gap: 6, paddingVertical: 12 }}>
                <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
                  {date(r.date)}
                </Text>
                <Text variant="titleMedium">{pick(r.title)}</Text>
                <Text variant="bodyMedium">{pick(r.summary)}</Text>
                {r.changes.map((c, i) => (
                  <View key={i} style={styles.change}>
                    <Chip compact textStyle={{ fontSize: 11 }}>
                      {t(`changelog.type.${c.type}`)}
                    </Chip>
                    <Text variant="bodySmall" style={styles.flex}>
                      {locale === "bn" ? c.bn : c.en}
                    </Text>
                  </View>
                ))}
              </Card.Content>
            </Card>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 48 },
  inner: { width: "100%", maxWidth: 720, alignSelf: "center", gap: 12 },
  card: { borderRadius: 20 },
  h: { marginTop: 8, fontWeight: "700" },
  change: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
});
