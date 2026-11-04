import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Button, Card, Chip, FAB, Icon, Searchbar, SegmentedButtons, Text, useTheme } from "react-native-paper";
import { Tap } from "@/components/community-bits";
import { OfflineNote } from "@/components/offline-note";
import { useCached } from "@/lib/cache";
import { fetchQuestions, fetchTopics, PAGE_SIZE, SORTS, type Sort } from "@/lib/community";
import { usePrefs } from "@/lib/prefs";
import { useSession } from "@/lib/session";

const excerpt = (s: string, n = 140) => {
  const flat = s.replace(/\s+/g, " ").trim();
  return flat.length > n ? flat.slice(0, n - 1).trimEnd() + "…" : flat;
};

/** The farmers' community: questions by topic, search, latest / unanswered / most helpful. */
export default function CommunityScreen() {
  const { t, locale, n, date } = usePrefs();
  const theme = useTheme();
  const signedIn = Boolean(useSession().session);
  const [topic, setTopic] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("latest");
  const [pages, setPages] = useState(1);
  const topics = useCached("community.topics", fetchTopics);
  const list = useCached(`community.list.${topic ?? "all"}.${sort}.${q}.${pages}`, () => fetchQuestions({ topicId: topic, q, sort, pages }));
  const { reload } = list;
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );
  const topicName = (id: string | null) => {
    const x = (topics.data ?? []).find((tp) => tp.id === id);
    return x ? (locale === "bn" ? x.name_bn : x.name_en) : null;
  };
  const questions = list.data?.questions ?? [];
  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]} testID="community-screen">
      <Appbar.Header mode="small" elevated={false}>
        <Appbar.BackAction onPress={() => (router.canGoBack() ? router.back() : router.replace("/more"))} accessibilityLabel={t("animal.back")} />
        <Appbar.Content title={t("community.title")} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.inner}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {t("community.desc")}
          </Text>
          {list.offline && <OfflineNote />}
          <Searchbar
            placeholder={t("community.searchPlaceholder")}
            value={typed}
            onChangeText={setTyped}
            onSubmitEditing={() => {
              setQ(typed.trim());
              setPages(1);
            }}
            onClearIconPress={() => setQ("")}
            testID="cm-search"
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            <Chip selected={topic === null} onPress={() => setTopic(null)} testID="cm-topic-all">
              {t("community.allTopics")}
            </Chip>
            {(topics.data ?? []).map((tp) => (
              <Chip key={tp.id} selected={topic === tp.id} onPress={() => (setTopic(tp.id), setPages(1))} testID={`cm-topic-${tp.slug}`}>
                {locale === "bn" ? tp.name_bn : tp.name_en}
              </Chip>
            ))}
          </ScrollView>
          <SegmentedButtons
            value={sort}
            onValueChange={(v) => (setSort(v as Sort), setPages(1))}
            buttons={SORTS.map((s) => ({ value: s, label: t(`community.sort.${s}`), testID: `cm-sort-${s}` }))}
          />
          {list.data && questions.length === 0 && <Text>{q ? t("community.noResults") : t("community.empty")}</Text>}
          {questions.map((x) => (
            <Card key={x.id} mode="outlined" style={styles.card}>
              <Tap onPress={() => router.push({ pathname: "/community/q/[id]", params: { id: x.id } })} testID={`cm-q-${x.id}`}>
                <Card.Content style={{ gap: 6, paddingVertical: 12 }}>
                  <Text variant="titleSmall">{x.title}</Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {excerpt(x.body)}
                  </Text>
                  <View style={styles.meta}>
                    {x.best_answer_id && (
                      <Chip compact icon="check-circle" testID="cm-solved">
                        {t("community.solved")}
                      </Chip>
                    )}
                    <Icon source="comment-text-outline" size={16} />
                    <Text variant="bodySmall">{t("community.answersCount", { n: n(x.answer_count) })}</Text>
                    <Icon source="thumb-up-outline" size={16} />
                    <Text variant="bodySmall">{n(x.helpful_count)}</Text>
                    {topicName(x.topic_id) && <Text variant="bodySmall">· {topicName(x.topic_id)}</Text>}
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      · {date(x.last_activity_at.slice(0, 10))}
                    </Text>
                  </View>
                </Card.Content>
              </Tap>
            </Card>
          ))}
          {list.data && list.data.total > questions.length && questions.length === pages * PAGE_SIZE && (
            <Button mode="outlined" onPress={() => setPages(pages + 1)} testID="cm-more">
              {t("community.loadMore")}
            </Button>
          )}
          <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.elevation.level2 }]}>
            <Card.Content style={{ gap: 4 }}>
              <Text variant="titleSmall">{t("community.rulesTitle")}</Text>
              <Text variant="bodySmall">{t("community.rulesBody")}</Text>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
      {signedIn && <FAB icon="plus" label={t("community.ask")} style={styles.fab} onPress={() => router.push("/community/ask")} testID="cm-ask" />}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 96 },
  inner: { width: "100%", maxWidth: 720, alignSelf: "center", gap: 12 },
  card: { borderRadius: 20, overflow: "hidden" },
  meta: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 },
  fab: { position: "absolute", right: 16, bottom: 24 },
});
