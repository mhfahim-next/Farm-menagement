import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Button, Card, Text, useTheme } from "react-native-paper";
import { diseaseBySlug, SYMPTOMS, type Bi } from "@/lib/diseases";
import { usePrefs } from "@/lib/prefs";
import { useSession } from "@/lib/session";

/** One disease: signs, what to do now, prevention, find a vet. */
export default function DiseaseScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t, locale } = usePrefs();
  const theme = useTheme();
  const vet = useSession().current?.role === "vet";
  const d = diseaseBySlug(slug ?? "");
  const pick = (b: Bi) => (locale === "bn" ? b.bn : b.en);
  const section = (title: string, items: Bi[], testID: string) => (
    <View style={{ gap: 6 }} testID={testID}>
      <Text variant="titleMedium">{title}</Text>
      {items.map((x, i) => (
        <Text key={i} variant="bodyMedium">{`• ${pick(x)}`}</Text>
      ))}
    </View>
  );
  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]} testID="disease-screen">
      <Appbar.Header mode="small" elevated={false}>
        <Appbar.BackAction onPress={() => (router.canGoBack() ? router.back() : router.replace("/diseases"))} accessibilityLabel={t("animal.back")} />
        <Appbar.Content title={d ? pick(d.name) : t("dis.title")} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.content}>
        {d && (
          <View style={styles.inner}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {[d.species.map((s) => t(`dis.species.${s}`)).join(" · "), d.aka && t("dis.aka", { names: pick(d.aka) })].filter(Boolean).join("\n")}
            </Text>
            <Text variant="bodyLarge">{pick(d.summary)}</Text>
            {(d.urgent || d.zoonotic || d.report) && (
              <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.errorContainer }]} testID="dis-warning">
                <Card.Content style={{ gap: 4 }}>
                  {d.urgent && <Text variant="titleSmall">{t("dis.urgentNote")}</Text>}
                  {d.zoonotic && <Text variant="bodyMedium">{t("dis.zoonoticNote")}</Text>}
                  {d.report && <Text variant="bodyMedium">{t("dis.reportNote")}</Text>}
                </Card.Content>
              </Card>
            )}
            {section(t("dis.signs"), d.signs, "dis-signs")}
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{`${t("dis.checkList")}: ${d.symptoms.map((s) => pick(SYMPTOMS[s])).join(" · ")}`}</Text>
            {section(t("dis.todo"), d.todo, "dis-todo")}
            {section(t("dis.prevent"), d.prevent, "dis-prevent")}
            <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.primaryContainer }]}>
              <Card.Content style={{ gap: 8 }}>
                <Text variant="titleMedium">{t("dis.vetTitle")}</Text>
                <Text variant="bodyMedium">{t("dis.vetBody")}</Text>
                <Button mode="contained" icon="stethoscope" onPress={() => router.push(vet ? "/doctor" : "/doctors")} testID="dis-find-vet">
                  {t("dis.findVet")}
                </Button>
              </Card.Content>
            </Card>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {t("dis.notDiagnosis")}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 48 },
  inner: { width: "100%", maxWidth: 720, alignSelf: "center", gap: 14 },
  card: { borderRadius: 20 },
});
