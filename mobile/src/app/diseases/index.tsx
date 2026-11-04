import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Card, Chip, List, SegmentedButtons, Text, useTheme } from "react-native-paper";
import { DISEASE_SPECIES, DISEASES, matchDiseases, SYMPTOMS, symptomsFor, type Bi, type DiseaseSpecies, type SymptomId } from "@/lib/diseases";
import { usePrefs } from "@/lib/prefs";

/** Disease guide: pick the animal, tick the signs, see the diseases that fit; and the full list. Works offline (it's all in the app). */
export default function DiseasesScreen() {
  const { t, locale } = usePrefs();
  const theme = useTheme();
  const pick = (b: Bi) => (locale === "bn" ? b.bn : b.en);
  const [species, setSpecies] = useState<DiseaseSpecies>("cattle");
  const [seen, setSeen] = useState<SymptomId[]>([]);
  const results = matchDiseases(species, seen);
  const toggle = (id: SymptomId) => setSeen((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const open = (slug: string) => router.push({ pathname: "/diseases/[slug]", params: { slug } });
  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]} testID="diseases-screen">
      <Appbar.Header mode="small" elevated={false}>
        <Appbar.BackAction onPress={() => (router.canGoBack() ? router.back() : router.replace("/more"))} accessibilityLabel={t("animal.back")} />
        <Appbar.Content title={t("dis.title")} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inner}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {t("dis.intro")}
          </Text>
          <Card mode="outlined" style={styles.card}>
            <Card.Title title={t("dis.checkerTitle")} subtitle={t("dis.checkerBody")} titleVariant="titleMedium" />
            <Card.Content style={{ gap: 10 }}>
              <SegmentedButtons
                value={species}
                onValueChange={(v) => {
                  setSpecies(v as DiseaseSpecies);
                  setSeen([]);
                }}
                buttons={DISEASE_SPECIES.map((s) => ({ value: s, label: t(`dis.species.${s}`), testID: `dis-species-${s}` }))}
              />
              <View style={styles.chips}>
                {symptomsFor(species).map((id) => (
                  <Chip key={id} selected={seen.includes(id)} showSelectedCheck onPress={() => toggle(id)} style={styles.chip} textStyle={styles.chipText} testID={`dis-sym-${id}`}>
                    {pick(SYMPTOMS[id])}
                  </Chip>
                ))}
              </View>
              {seen.length === 0 ? (
                <Text style={{ color: theme.colors.onSurfaceVariant }}>{t("dis.pickSigns")}</Text>
              ) : results.length === 0 ? (
                <Text style={{ color: theme.colors.onSurfaceVariant }}>{t("dis.noMatch")}</Text>
              ) : (
                <View testID="dis-results">
                  {results.map((r) => (
                    <List.Item
                      key={r.disease.slug}
                      title={pick(r.disease.name)}
                      description={[t("dis.matched", { n: r.matched.length, of: r.disease.symptoms.length }), r.disease.urgent && t("dis.urgent"), r.disease.zoonotic && t("dis.zoonotic")].filter(Boolean).join(" · ")}
                      left={(p) => <List.Icon {...p} icon={r.disease.urgent ? "alert-circle-outline" : "information-outline"} color={r.disease.urgent ? theme.colors.error : p.color} />}
                      onPress={() => open(r.disease.slug)}
                      testID={`dis-result-${r.disease.slug}`}
                    />
                  ))}
                </View>
              )}
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {t("dis.notDiagnosis")}
              </Text>
            </Card.Content>
          </Card>
          {DISEASE_SPECIES.map((s) => (
            <View key={s}>
              <List.Subheader>{t(`dis.list.${s}`)}</List.Subheader>
              {DISEASES.filter((d) => d.species.includes(s)).map((d) => (
                <List.Item key={d.slug} title={pick(d.name)} description={pick(d.summary)} descriptionNumberOfLines={2} onPress={() => open(d.slug)} testID={`dis-card-${d.slug}`} />
              ))}
            </View>
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
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { maxWidth: "100%" },
  chipText: { flexShrink: 1 },
});
