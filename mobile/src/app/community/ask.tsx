import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Button, Text, TextInput, useTheme } from "react-native-paper";
import { PhotoAdder } from "@/components/community-bits";
import { ChoiceChips, Label } from "@/components/fields";
import { useCached } from "@/lib/cache";
import { ask, communityError, fetchTopics } from "@/lib/community";
import { useOnline } from "@/lib/net";
import { usePrefs } from "@/lib/prefs";
import { useSession } from "@/lib/session";
import { useToast } from "@/lib/toast";

/** Ask the community: topic, one-line question, details, up to 4 photos. */
export default function AskScreen() {
  const { t, locale } = usePrefs();
  const theme = useTheme();
  const toast = useToast();
  const online = useOnline();
  const uid = useSession().session?.user.id;
  const topics = useCached("community.topics", fetchTopics);
  const [topic, setTopic] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (title.trim().length < 10) return toast(t("community.errTitleShort"));
    if (body.trim().length < 10) return toast(t("community.errBodyShort"));
    setBusy(true);
    try {
      const id = await ask(topic || null, title.trim(), body.trim(), photos);
      router.replace({ pathname: "/community/q/[id]", params: { id } });
    } catch (e) {
      const key = communityError(e instanceof Error ? e.message : "");
      toast(key ? t(key) : `${t("common.error")} ${e instanceof Error ? e.message : ""}`);
    } finally {
      setBusy(false);
    }
  };
  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: theme.colors.background }]} behavior={Platform.OS === "ios" ? "padding" : undefined} testID="ask-screen">
      <Appbar.Header mode="small" elevated={false}>
        <Appbar.BackAction onPress={() => (router.canGoBack() ? router.back() : router.replace("/community"))} accessibilityLabel={t("animal.back")} />
        <Appbar.Content title={t("community.ask")} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.inner}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {t("community.askIntro")}
          </Text>
          <Label>{t("community.fieldTopic")}</Label>
          <ChoiceChips options={(topics.data ?? []).map((x) => ({ value: x.id, label: locale === "bn" ? x.name_bn : x.name_en }))} value={topic} onChange={(v) => setTopic(v === topic ? "" : v)} testID="cm-ask-topic" />
          <TextInput mode="outlined" label={t("community.fieldTitle")} placeholder={t("community.titlePlaceholder")} value={title} onChangeText={setTitle} maxLength={200} testID="cm-ask-title" />
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {t("community.titleHint")}
          </Text>
          <TextInput mode="outlined" multiline numberOfLines={6} label={t("community.fieldBody")} value={body} onChangeText={setBody} maxLength={10000} testID="cm-ask-body" />
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {t("community.bodyHint")}
          </Text>
          <Label>{t("community.photos")}</Label>
          {uid && <PhotoAdder userId={uid} paths={photos} onChange={setPhotos} />}
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {t("community.rulesBody")}
          </Text>
          <Button mode="contained" onPress={submit} loading={busy} disabled={busy || !online || !uid} contentStyle={{ height: 48 }} testID="cm-ask-post">
            {t("community.post")}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 48 },
  inner: { width: "100%", maxWidth: 720, alignSelf: "center", gap: 10 },
});
