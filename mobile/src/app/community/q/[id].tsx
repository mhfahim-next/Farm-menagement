import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Button, Card, Chip, Text, TextInput, useTheme } from "react-native-paper";
import { AuthorLine, PhotoAdder, Photos, ReportButton } from "@/components/community-bits";
import { OfflineNote } from "@/components/offline-note";
import { useCached } from "@/lib/cache";
import { answer, communityError, fetchQuestion, orderAnswers, removePost, setBest, toggleHelpful, type Answer } from "@/lib/community";
import { useOnline } from "@/lib/net";
import { usePrefs } from "@/lib/prefs";
import { useSession } from "@/lib/session";
import { useToast } from "@/lib/toast";

/** One question with its answers: helpful, best answer (asker), report, answer with photos, delete own posts. */
export default function QuestionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, n } = usePrefs();
  const theme = useTheme();
  const toast = useToast();
  const online = useOnline();
  const uid = useSession().session?.user.id;
  const data = useCached(id ? `community.q.${id}.${uid ?? "anon"}` : null, () => fetchQuestion(id, uid));
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const d = data.data;
  const q = d?.question;
  const fail = (e: unknown) => {
    const key = communityError(e instanceof Error ? e.message : "");
    toast(key ? t(key) : `${t("common.error")} ${e instanceof Error ? e.message : ""}`);
  };
  const helpful = async (type: "question" | "answer", targetId: string) => {
    if (!uid) return toast(t("community.signInToVote"));
    try {
      await toggleHelpful(type, targetId);
      data.reload();
    } catch (e) {
      fail(e);
    }
  };
  const best = async (a: Answer | null) => {
    if (!q) return;
    try {
      await setBest(q.id, a?.id ?? null);
      toast(t(a ? "community.bestSet" : "community.bestCleared"));
      data.reload();
    } catch (e) {
      fail(e);
    }
  };
  const del = (type: "question" | "answer", targetId: string) => {
    const go = async () => {
      try {
        await removePost(type, targetId);
        toast(t("community.deleted"));
        if (type === "question") router.replace("/community");
        else data.reload();
      } catch (e) {
        fail(e);
      }
    };
    const msg = t(type === "question" ? "community.confirmDeleteQuestion" : "community.confirmDeleteAnswer");
    if (Platform.OS === "web") {
      if (globalThis.confirm?.(msg)) go();
    } else Alert.alert(t("community.delete"), msg, [{ text: t("common.cancel"), style: "cancel" }, { text: t("community.delete"), style: "destructive", onPress: go }]);
  };
  const post = async () => {
    if (!q || body.trim().length < 2) return toast(t("community.errLength"));
    setBusy(true);
    try {
      await answer(q.id, body.trim(), photos);
      setBody("");
      setPhotos([]);
      toast(t("community.answerPosted"));
      data.reload();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };
  const answers = d ? orderAnswers(d.answers, q?.best_answer_id ?? null, d.authors) : [];
  const mine = new Set(d?.helpful ?? []);
  const isAsker = Boolean(uid && q && q.author_id === uid);

  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: theme.colors.background }]} behavior={Platform.OS === "ios" ? "padding" : undefined} testID="question-screen">
      <Appbar.Header mode="small" elevated={false}>
        <Appbar.BackAction onPress={() => (router.canGoBack() ? router.back() : router.replace("/community"))} accessibilityLabel={t("animal.back")} />
        <Appbar.Content title={t("community.title")} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.inner}>
          {data.offline && <OfflineNote />}
          {data.data === null && !data.loading && <Text>{t("community.errNotFound")}</Text>}
          {q && d && (
            <>
              {q.status === "pending" && <Chip icon="clock-outline">{t("community.pendingNotice")}</Chip>}
              {q.status === "hidden" && <Chip icon="eye-off">{t("community.hiddenNotice")}</Chip>}
              <Text variant="titleLarge" testID="cm-q-title">
                {q.title}
              </Text>
              <AuthorLine author={d.authors[q.author_id]} date={q.created_at} />
              <Text variant="bodyLarge">{q.body}</Text>
              <Photos paths={q.images} />
              <View style={styles.actions}>
                <Button
                  compact
                  icon={mine.has(q.id) ? "thumb-up" : "thumb-up-outline"}
                  mode={mine.has(q.id) ? "contained-tonal" : "text"}
                  onPress={() => helpful("question", q.id)}
                  disabled={isAsker}
                  testID="cm-helpful-q"
                >
                  {`${t("community.helpful")} · ${n(q.helpful_count)}`}
                </Button>
                {uid && !isAsker && <ReportButton type="question" id={q.id} />}
                {isAsker && (
                  <Button compact icon="delete-outline" textColor={theme.colors.error} onPress={() => del("question", q.id)} testID="cm-delete-q">
                    {t("community.delete")}
                  </Button>
                )}
              </View>

              <Text variant="titleMedium">{t("community.answersCount", { n: n(answers.length) })}</Text>
              {answers.length === 0 && <Text style={{ color: theme.colors.onSurfaceVariant }}>{t("community.noAnswers")}</Text>}
              {answers.map((a) => {
                const isBest = a.id === q.best_answer_id;
                return (
                  <Card key={a.id} mode={isBest ? "contained" : "outlined"} style={[styles.card, isBest && { backgroundColor: theme.colors.primaryContainer }]} testID={`cm-answer-${a.id}`}>
                    <Card.Content style={{ gap: 8, paddingTop: 12 }}>
                      {isBest && (
                        <Chip compact icon="check-circle" style={{ alignSelf: "flex-start" }} testID="cm-best">
                          {t("community.bestAnswer")}
                        </Chip>
                      )}
                      {a.status === "pending" && <Chip compact icon="clock-outline">{t("community.statusPending")}</Chip>}
                      <AuthorLine author={d.authors[a.author_id]} date={a.created_at} />
                      <Text variant="bodyMedium">{a.body}</Text>
                      <Photos paths={a.images} />
                      <View style={styles.actions}>
                        <Button
                          compact
                          icon={mine.has(a.id) ? "thumb-up" : "thumb-up-outline"}
                          mode={mine.has(a.id) ? "contained-tonal" : "text"}
                          onPress={() => helpful("answer", a.id)}
                          disabled={a.author_id === uid}
                          testID={`cm-helpful-${a.id}`}
                        >
                          {`${t("community.helpful")} · ${n(a.helpful_count)}`}
                        </Button>
                        {isAsker && a.status === "published" && (
                          <Button compact icon={isBest ? "close-circle-outline" : "check-circle-outline"} onPress={() => best(isBest ? null : a)} testID={`cm-best-${a.id}`}>
                            {isBest ? t("community.unmarkBest") : t("community.markBest")}
                          </Button>
                        )}
                        {uid && a.author_id !== uid && <ReportButton type="answer" id={a.id} />}
                        {a.author_id === uid && (
                          <Button compact icon="delete-outline" textColor={theme.colors.error} onPress={() => del("answer", a.id)}>
                            {t("community.delete")}
                          </Button>
                        )}
                      </View>
                    </Card.Content>
                  </Card>
                );
              })}

              {q.status !== "published" ? (
                <Text style={{ color: theme.colors.onSurfaceVariant }}>{t("community.answersClosed")}</Text>
              ) : !uid ? (
                <Text>{t("community.loginToAnswer")}</Text>
              ) : (
                <Card mode="outlined" style={styles.card}>
                  <Card.Title title={t("community.yourAnswer")} titleVariant="titleSmall" />
                  <Card.Content style={{ gap: 10 }}>
                    <TextInput mode="outlined" multiline numberOfLines={4} label={t("community.fieldAnswer")} value={body} onChangeText={setBody} maxLength={10000} testID="cm-answer-body" />
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {t("community.answerHint")}
                    </Text>
                    <PhotoAdder userId={uid} paths={photos} onChange={setPhotos} />
                    <Button mode="contained" onPress={post} loading={busy} disabled={busy || !online || body.trim().length < 2} testID="cm-answer-post">
                      {t("community.postAnswer")}
                    </Button>
                  </Card.Content>
                </Card>
              )}
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
  card: { borderRadius: 20 },
  actions: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 4 },
});
