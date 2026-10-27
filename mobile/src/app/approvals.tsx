import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Button, Card, Chip, Dialog, Portal, Text, TextInput, useTheme } from "react-native-paper";
import { FormError } from "@/components/form-error";
import { OfflineNote } from "@/components/offline-note";
import { usePrefs } from "@/lib/prefs";
import { useSession } from "@/lib/session";
import { decideApproval, useApprovals, type ApprovalItem } from "@/lib/site-api";
import { useToast } from "@/lib/toast";

/**
 * Doctors' health and breeding entries. The owner or a manager approves or
 * rejects them; a doctor sees what they sent and can withdraw one still waiting.
 */
export default function Approvals() {
  const { t, locale, date } = usePrefs();
  const theme = useTheme();
  const toast = useToast();
  const farm = useSession().current?.farm;
  const { data, offline, error, reload } = useApprovals(farm?.id, locale);
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<ApprovalItem | null>(null);
  const [note, setNote] = useState("");
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );
  const back = () => (router.canGoBack() ? router.back() : router.replace("/more"));

  const act = async (item: ApprovalItem, action: "approve" | "reject" | "cancel", reason = "") => {
    if (!farm) return;
    setBusy(item.id);
    try {
      const r = await decideApproval(farm.id, locale, item.id, action, reason);
      toast(r.message || t("rec.saved"));
    } catch (e) {
      toast(`${t("common.error")} ${e instanceof Error ? e.message : ""}`);
    } finally {
      setBusy(null);
      reload();
    }
  };

  const tone = (s: ApprovalItem["status"]) =>
    s === "pending" ? theme.colors.tertiaryContainer : s === "approved" ? theme.colors.primaryContainer : theme.colors.errorContainer;

  const card = (e: ApprovalItem, actions: boolean) => (
    <Card key={e.id} mode="outlined" style={styles.card} testID="approval-item">
      <Card.Content style={{ gap: 6 }}>
        <View style={styles.head}>
          <Text variant="titleMedium" style={styles.flex}>
            {e.title}
          </Text>
          <Chip compact style={{ backgroundColor: tone(e.status) }}>
            {t(`appr.status.${e.status}`)}
          </Chip>
        </View>
        {e.lines.map((l, i) => (
          <Text key={i} variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {l}
          </Text>
        ))}
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {[data?.canDecide && e.by ? t("appr.by", { name: e.by }) : "", date(e.created_at), e.status !== "pending" && data?.canDecide && e.decidedBy ? t("appr.decidedBy", { name: e.decidedBy }) : ""]
            .filter(Boolean)
            .join(" · ")}
        </Text>
        {e.status === "rejected" && e.note ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
            {t("appr.reason", { note: e.note })}
          </Text>
        ) : null}
        {actions &&
          (data?.canDecide ? (
            <View style={styles.row}>
              <Button mode="contained" icon="check" onPress={() => act(e, "approve")} loading={busy === e.id} disabled={busy !== null} testID="approve">
                {t("appr.approve")}
              </Button>
              <Button mode="outlined" icon="close" textColor={theme.colors.error} onPress={() => (setNote(""), setRejecting(e))} disabled={busy !== null} testID="reject">
                {t("appr.reject")}
              </Button>
            </View>
          ) : (
            <Button mode="text" icon="undo" onPress={() => act(e, "cancel")} loading={busy === e.id} disabled={busy !== null} style={{ alignSelf: "flex-start" }} testID="withdraw">
              {t("appr.withdraw")}
            </Button>
          ))}
      </Card.Content>
    </Card>
  );

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]} testID="approvals">
      <Appbar.Header mode="small" elevated={false}>
        <Appbar.BackAction onPress={back} accessibilityLabel={t("animal.back")} />
        <Appbar.Content title={t("appr.title")} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inner}>
          {offline && <OfflineNote />}
          {error && !data && <FormError message={t("common.error")} detail={error} />}
          {data && (
            <>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {data.canDecide ? t("appr.descManager") : t("appr.descVet")}
              </Text>
              <Text variant="titleMedium">{data.canDecide ? t("appr.waitingManager") : t("appr.waitingVet")}</Text>
              {data.waiting.length === 0 ? (
                <Text style={{ color: theme.colors.onSurfaceVariant }} testID="approvals-none">
                  {t("appr.none")}
                </Text>
              ) : (
                data.waiting.map((e) => card(e, true))
              )}
              {data.done.length > 0 && (
                <>
                  <Text variant="titleMedium" style={{ marginTop: 8 }}>
                    {t("appr.history")}
                  </Text>
                  {data.done.map((e) => card(e, false))}
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>
      <Portal>
        <Dialog visible={rejecting !== null} onDismiss={() => setRejecting(null)}>
          <Dialog.Title>{t("appr.reject")}</Dialog.Title>
          <Dialog.Content style={{ gap: 8 }}>
            <Text variant="bodyMedium">{rejecting?.title}</Text>
            <TextInput mode="outlined" label={t("appr.reasonLabel")} value={note} onChangeText={setNote} multiline maxLength={500} testID="reject-note" />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setRejecting(null)}>{t("common.cancel")}</Button>
            <Button
              textColor={theme.colors.error}
              onPress={() => {
                const item = rejecting;
                setRejecting(null);
                if (item) act(item, "reject", note);
              }}
              testID="reject-confirm"
            >
              {t("appr.reject")}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  inner: { width: "100%", maxWidth: 720, alignSelf: "center", gap: 12 },
  card: { borderRadius: 20 },
  head: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 4 },
});
