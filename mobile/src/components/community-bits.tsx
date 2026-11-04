import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Avatar, Button, Chip, Dialog, IconButton, Portal, RadioButton, Text, TextInput, useTheme } from "react-native-paper";
import { addCommunityPhoto, communityError, communityImageUrl, dropCommunityPhoto, MAX_COMMUNITY_IMAGES, REPORT_REASONS, report, type Author } from "@/lib/community";
import { usePrefs } from "@/lib/prefs";
import { useToast } from "@/lib/toast";

/** Name, photo and "Verified vet" badge of a post's author, with the date. */
export function AuthorLine({ author, date }: { author: Author | undefined; date: string }) {
  const { t, date: fmt } = usePrefs();
  const theme = useTheme();
  return (
    <View style={styles.row}>
      {author?.avatar_url ? <Avatar.Image size={28} source={{ uri: author.avatar_url }} /> : <Avatar.Icon size={28} icon="account" />}
      <Text variant="labelLarge">{author?.full_name ?? t("community.member")}</Text>
      {author?.is_vet && (
        <Chip compact icon="check-decagram" textStyle={{ fontSize: 12 }} testID="vet-badge">
          {t("community.vetBadge")}
        </Chip>
      )}
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
        {fmt(date.slice(0, 10))}
      </Text>
    </View>
  );
}

/** A post's photos, side by side. */
export function Photos({ paths }: { paths: string[] }) {
  if (!paths.length) return null;
  return (
    <ScrollView horizontal contentContainerStyle={{ gap: 8 }}>
      {paths.map((p) => (
        <Image key={p} source={{ uri: communityImageUrl(p) }} style={styles.photo} accessibilityIgnoresInvertColors />
      ))}
    </ScrollView>
  );
}

/** Up to 4 photos for a new post: picked, made small, uploaded at once. */
export function PhotoAdder({ userId, paths, onChange }: { userId: string; paths: string[]; onChange: (p: string[]) => void }) {
  const { t } = usePrefs();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const add = async () => {
    setBusy(true);
    try {
      const path = await addCommunityPhoto(userId);
      if (path) onChange([...paths, path]);
    } catch {
      toast(t("community.imageFailed"));
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={{ gap: 8 }}>
      <View style={[styles.row, { flexWrap: "wrap" }]}>
        {paths.map((p) => (
          <View key={p}>
            <Image source={{ uri: communityImageUrl(p) }} style={styles.thumb} />
            <IconButton
              icon="close"
              size={16}
              mode="contained"
              style={styles.remove}
              onPress={() => {
                dropCommunityPhoto(p);
                onChange(paths.filter((x) => x !== p));
              }}
              accessibilityLabel={t("community.removePhoto")}
            />
          </View>
        ))}
      </View>
      {paths.length < MAX_COMMUNITY_IMAGES && (
        <Button mode="outlined" icon="image-plus" onPress={add} loading={busy} disabled={busy} style={{ alignSelf: "flex-start" }} testID="cm-add-photo">
          {busy ? t("community.uploading") : t("community.addPhoto")}
        </Button>
      )}
    </View>
  );
}

/** "Report" with a reason and an optional note. */
export function ReportButton({ type, id }: { type: "question" | "answer"; id: string }) {
  const { t } = usePrefs();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<(typeof REPORT_REASONS)[number] | "">("");
  const [note, setNote] = useState("");
  const send = async () => {
    if (!reason) return toast(t("community.reportPickReason"));
    try {
      await report(type, id, reason, note.trim());
      setOpen(false);
      toast(t("community.reported"));
    } catch (e) {
      const key = communityError(e instanceof Error ? e.message : "");
      toast(key ? t(key) : t("common.error"));
    }
  };
  return (
    <>
      <Button compact icon="flag-outline" onPress={() => setOpen(true)} testID={`cm-report-${type}`}>
        {t("community.report")}
      </Button>
      <Portal>
        <Dialog visible={open} onDismiss={() => setOpen(false)}>
          <Dialog.Title>{t("community.reportWhy")}</Dialog.Title>
          <Dialog.Content style={{ gap: 8 }}>
            <RadioButton.Group value={reason} onValueChange={(v) => setReason(v as typeof reason)}>
              {REPORT_REASONS.map((r) => (
                <RadioButton.Item key={r} value={r} label={t(`community.reason.${r}`)} mode="android" />
              ))}
            </RadioButton.Group>
            <TextInput mode="outlined" label={t("community.reportNote")} value={note} onChangeText={setNote} maxLength={500} />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setOpen(false)}>{t("common.cancel")}</Button>
            <Button onPress={send} testID="cm-report-send">
              {t("community.reportSend")}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

/** A tappable row (used for list cards). */
export function Tap({ onPress, children, testID }: { onPress: () => void; children: React.ReactNode; testID?: string }) {
  return (
    <Pressable onPress={onPress} testID={testID} android_ripple={{ color: "#00000014" }}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  photo: { width: 220, height: 165, borderRadius: 12 },
  thumb: { width: 84, height: 84, borderRadius: 10 },
  remove: { position: "absolute", top: -6, right: -6, margin: 0 },
});
