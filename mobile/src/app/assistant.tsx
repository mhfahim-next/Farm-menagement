import { router } from "expo-router";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type ScrollViewInstance } from "react-native";
import { ActivityIndicator, Appbar, Button, Card, Chip, IconButton, Text, TextInput, useTheme } from "react-native-paper";
import { OfflineNote } from "@/components/offline-note";
import { isStaff } from "@/lib/data";
import { useOnline } from "@/lib/net";
import { usePrefs } from "@/lib/prefs";
import { useSession } from "@/lib/session";
import { askAi, confirmAi, fetchAiStatus, type AiProposal, type AiStatus, type AiTurn } from "@/lib/site-api";
import { useToast } from "@/lib/toast";

type PState = AiProposal & { state: "pending" | "saving" | "saved" | "cancelled"; error?: string };
type Msg = { id: number; role: "user" | "assistant"; text: string; error?: boolean; proposals?: PState[] };

/** Speech to text, when the phone (or browser) has a recognition service. */
function canListen() {
  try {
    return ExpoSpeechRecognitionModule.isRecognitionAvailable();
  } catch {
    return false;
  }
}

/**
 * The AI assistant: say or type what happened ("today 001 gave 6 litres"); it
 * prepares the record and nothing is saved until the farmer presses Confirm.
 * Same assistant, monthly limit and rules as the website (/api/app/assistant).
 */
export default function AssistantScreen() {
  const { t, locale, n } = usePrefs();
  const theme = useTheme();
  const toast = useToast();
  const current = useSession().current;
  const farm = current?.farm;
  const online = useOnline();
  const staff = isStaff(current?.role);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [listening, setListening] = useState(false);
  const [mic] = useState(canListen);
  const spokenBase = useRef("");
  const nextId = useRef(1);
  const scroll = useRef<ScrollViewInstance>(null);

  useEffect(() => {
    if (!farm || !staff || !online) return;
    fetchAiStatus(farm.id, locale).then(setStatus, () => {});
  }, [farm, staff, online, locale]);

  useSpeechRecognitionEvent("result", (e) => setInput(spokenBase.current + (e.results[0]?.transcript ?? "")));
  useSpeechRecognitionEvent("end", () => setListening(false));
  useSpeechRecognitionEvent("error", () => setListening(false));

  const limitReached = status !== null && status.max !== null && status.used >= status.max;
  const left = status && status.max !== null ? Math.max(0, status.max - status.used) : null;

  const add = (m: Omit<Msg, "id">) => setMsgs((all) => [...all, { ...m, id: nextId.current++ }]);
  const patch = (msgId: number, pId: string, change: Partial<PState>) =>
    setMsgs((all) => all.map((m) => (m.id === msgId ? { ...m, proposals: m.proposals?.map((p) => (p.id === pId ? { ...p, ...change } : p)) } : m)));

  const toggleMic = async () => {
    if (listening) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }
    const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!perm.granted) return toast(t("ai.micDenied"));
    spokenBase.current = input ? input.trimEnd() + " " : "";
    setListening(true);
    ExpoSpeechRecognitionModule.start({ lang: locale === "bn" ? "bn-BD" : "en-US", interimResults: true, continuous: false });
  };

  const send = async (text = input) => {
    const message = text.trim();
    if (!message || busy || limitReached || !farm) return;
    if (listening) ExpoSpeechRecognitionModule.stop();
    const history: AiTurn[] = msgs.filter((m) => !m.error).map((m) => ({ role: m.role, text: m.text }));
    add({ role: "user", text: message });
    setInput("");
    setBusy(true);
    try {
      const res = await askAi(farm.id, locale, history, message);
      if (res.status) setStatus(res.status);
      if (res.error) add({ role: "assistant", text: res.error, error: true });
      else add({ role: "assistant", text: res.reply ?? "", proposals: (res.proposals ?? []).map((p) => ({ ...p, state: "pending" as const })) });
    } catch {
      add({ role: "assistant", text: t("ai.err.failed"), error: true });
    } finally {
      setBusy(false);
      setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
    }
  };

  const confirm = async (msgId: number, p: PState) => {
    if (!farm) return;
    patch(msgId, p.id, { state: "saving", error: undefined });
    try {
      await confirmAi(farm.id, locale, p);
      patch(msgId, p.id, { state: "saved" });
      toast(t("ai.saved"));
    } catch (e) {
      patch(msgId, p.id, { state: "pending", error: e instanceof Error ? e.message : t("ai.err.failed") });
    }
  };

  const examples = (["ai.ex1", "ai.ex2", "ai.ex3", "ai.ex4"] as const).map((k) => t(k));

  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: theme.colors.background }]} behavior={Platform.OS === "ios" ? "padding" : undefined} testID="assistant-screen">
      <Appbar.Header mode="small" elevated={false}>
        <Appbar.BackAction onPress={() => (router.canGoBack() ? router.back() : router.replace("/entry"))} accessibilityLabel={t("animal.back")} />
        <Appbar.Content title={t("ai.title")} />
      </Appbar.Header>
      <ScrollView ref={scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}>
        <View style={styles.inner}>
          {status && (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: "center" }} testID="ai-left">
              {left === null ? t("ai.unlimited") : t("ai.left", { left: n(left), max: n(status.max ?? 0) })}
            </Text>
          )}
          {!online && <OfflineNote />}
          {!online && <Text style={{ color: theme.colors.onSurfaceVariant }}>{t("ai.offline")}</Text>}
          {!staff && <Text testID="ai-not-staff">{t("ai.notStaff")}</Text>}
          {msgs.length === 0 && staff && (
            <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.elevation.level2 }]}>
              <Card.Content style={{ gap: 8 }}>
                <Text variant="bodyMedium">{t("ai.intro")}</Text>
                <Text variant="labelLarge">{t("ai.try")}</Text>
                <View style={styles.chips}>
                  {examples.map((ex, i) => (
                    <Chip key={i} onPress={() => setInput(ex)} style={styles.chip} textStyle={styles.chipText} testID={`ai-example-${i}`}>
                      {ex}
                    </Chip>
                  ))}
                </View>
              </Card.Content>
            </Card>
          )}
          {msgs.map((m) => (
            <View key={m.id} style={{ alignItems: m.role === "user" ? "flex-end" : "flex-start", gap: 6 }} testID={`ai-msg-${m.role}`}>
              {!!m.text && (
                <View
                  style={[
                    styles.bubble,
                    m.role === "user"
                      ? { backgroundColor: theme.colors.primary }
                      : { backgroundColor: m.error ? theme.colors.errorContainer : theme.colors.elevation.level2 },
                  ]}
                >
                  <Text style={{ color: m.role === "user" ? theme.colors.onPrimary : m.error ? theme.colors.onErrorContainer : theme.colors.onSurface }}>{m.text}</Text>
                </View>
              )}
              {m.proposals?.map((p) => (
                <Card key={p.id} mode="outlined" style={[styles.card, styles.proposal]} testID="ai-proposal">
                  <Card.Content style={{ gap: 4 }}>
                    <Text variant="titleSmall">{p.title}</Text>
                    {p.lines.map((l, i) => (
                      <Text key={i} variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {l}
                      </Text>
                    ))}
                    {p.error && (
                      <Text variant="bodySmall" style={{ color: theme.colors.error }} testID="ai-proposal-error">
                        {p.error}
                      </Text>
                    )}
                  </Card.Content>
                  <Card.Actions>
                    {p.state === "saved" ? (
                      <Chip icon="check" testID="ai-saved">
                        {t("ai.saved")}
                      </Chip>
                    ) : p.state === "cancelled" ? (
                      <Chip icon="close">{t("ai.cancelled")}</Chip>
                    ) : (
                      <>
                        <Button onPress={() => patch(m.id, p.id, { state: "cancelled" })} disabled={p.state === "saving"} testID="ai-cancel">
                          {t("ai.cancel")}
                        </Button>
                        <Button mode="contained" onPress={() => confirm(m.id, p)} loading={p.state === "saving"} disabled={p.state === "saving" || !online} testID="ai-confirm">
                          {t("ai.confirm")}
                        </Button>
                      </>
                    )}
                  </Card.Actions>
                </Card>
              ))}
            </View>
          ))}
          {busy && (
            <View style={styles.row}>
              <ActivityIndicator size="small" />
              <Text>{t("ai.thinking")}</Text>
            </View>
          )}
          {limitReached && (
            <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.errorContainer }]} testID="ai-limit">
              <Card.Content style={{ gap: 6 }}>
                <Text variant="titleSmall">{t("ai.limitTitle")}</Text>
                <Text variant="bodyMedium">{t("ai.limitBody", { max: n(status?.max ?? 0) })}</Text>
                <Button mode="contained-tonal" onPress={() => router.push("/onboarding/plan")}>
                  {t("ai.upgrade")}
                </Button>
              </Card.Content>
            </Card>
          )}
        </View>
      </ScrollView>
      {staff && (
        <View style={[styles.bar, { backgroundColor: theme.colors.elevation.level1, borderTopColor: theme.colors.outlineVariant }]}>
          {mic && (
            <IconButton
              icon={listening ? "stop-circle" : "microphone"}
              mode={listening ? "contained" : "contained-tonal"}
              iconColor={listening ? theme.colors.error : undefined}
              onPress={toggleMic}
              disabled={!online || limitReached}
              accessibilityLabel={listening ? t("ai.micStop") : t("ai.mic")}
              testID="ai-mic"
            />
          )}
          <TextInput
            mode="outlined"
            dense
            multiline
            value={input}
            onChangeText={setInput}
            placeholder={listening ? t("ai.listening") : t("ai.placeholder")}
            style={styles.flex}
            maxLength={2000}
            disabled={!online || limitReached}
            testID="ai-input"
          />
          <IconButton icon="send" mode="contained" onPress={() => send()} disabled={!input.trim() || busy || !online || limitReached} accessibilityLabel={t("ai.send")} testID="ai-send" />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 24 },
  inner: { width: "100%", maxWidth: 720, alignSelf: "center", gap: 12 },
  card: { borderRadius: 20 },
  proposal: { alignSelf: "stretch" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { maxWidth: "100%" },
  chipText: { flexShrink: 1 },
  bubble: { maxWidth: "85%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  bar: { flexDirection: "row", alignItems: "flex-end", gap: 4, paddingHorizontal: 8, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth },
});
