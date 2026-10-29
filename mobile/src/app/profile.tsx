import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { Button, Card, Dialog, Portal, Text, TextInput, useTheme } from "react-native-paper";
import { FormError } from "@/components/form-error";
import { FormScreen } from "@/components/form-screen";
import { PhotoPicker } from "@/components/photo-picker";
import { ChoiceChips, Label } from "@/components/fields";
import { DELETE_REASONS } from "@/lib/delete-reasons";
import { photoUrl, removePhoto, uploadPhoto } from "@/lib/photos";
import { usePrefs } from "@/lib/prefs";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/lib/toast";

const AVATAR_MARK = "/storage/v1/object/public/avatars/";

/** Your name, phone and photo, a new password, and deleting the account. */
export default function Profile() {
  const { t, date } = usePrefs();
  const theme = useTheme();
  const s = useSession();
  const toast = useToast();
  const uid = s.session?.user.id ?? "";
  const [name, setName] = useState(s.profile?.full_name ?? "");
  const [phone, setPhone] = useState(s.profile?.phone ?? "");
  const [photo, setPhoto] = useState<string | null>(s.profile?.avatar_url ?? null);
  const [photoChanged, setPhotoChanged] = useState(false);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState(false);
  const [confirmWord, setConfirmWord] = useState("");
  const [delError, setDelError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const word = t("profile.deleteWord");

  const save = async () => {
    if (name.trim().length < 2) return setError(t("auth.err.name"));
    setError(null);
    setBusy(true);
    try {
      let avatar_url = s.profile?.avatar_url ?? null;
      if (photoChanged) {
        const old = avatar_url?.includes(AVATAR_MARK) ? avatar_url.split(AVATAR_MARK)[1] : null;
        avatar_url = photo ? photoUrl("avatars", await uploadPhoto("avatars", uid, photo)) : null;
        if (old?.startsWith(`${uid}/`)) await removePhoto("avatars", old);
      }
      const { error: e } = await supabase.from("profiles").update({ full_name: name.trim(), phone: phone.trim() || null, avatar_url }).eq("id", uid);
      if (e) throw e;
      await s.reload();
      setPhotoChanged(false);
      toast(t("profile.saved"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const changePassword = async () => {
    if (password.length < 8) return setPwError(t("auth.err.weak"));
    if (password !== password2) return setPwError(t("profile.mismatch"));
    setPwError(null);
    const { error: e } = await supabase.auth.updateUser({ password });
    if (e) return setPwError(e.message);
    setPassword("");
    setPassword2("");
    toast(t("profile.passwordChanged"));
  };

  // Nothing is deleted yet: the account goes 30 days later, unless they sign in again before that.
  const deleteAccount = async () => {
    if (confirmWord.trim().toLowerCase() !== word.toLowerCase()) return setDelError(t("profile.typeWord", { word }));
    const { data: due, error: e } = await supabase.rpc("request_account_deletion", { p_reason: reason || null, p_note: note.trim(), p_source: "app" });
    if (e) {
      const shared = /SHARED_FARM:(.+)/.exec(e.message)?.[1];
      return setDelError(shared ? t("profile.sharedFarm", { farms: shared }) : e.message);
    }
    setDel(false);
    // Signed out on every phone and browser: signing in again is what keeps the account.
    await supabase.auth.signOut({ scope: "global" }).catch(() => {});
    await s.signOut();
    toast(t("profile.deleteRequested", { date: date(String(due).slice(0, 10)) }));
    router.replace("/");
  };

  return (
    <FormScreen title={t("profile.title")} testID="profile">
      <PhotoPicker
        round
        uri={photo}
        onPick={(u) => {
          setPhoto(u);
          setPhotoChanged(true);
        }}
        onRemove={() => {
          setPhoto(null);
          setPhotoChanged(true);
        }}
      />
      <TextInput mode="outlined" label={t("auth.fullName")} value={name} onChangeText={setName} testID="profile-name" />
      <TextInput mode="outlined" label={t("sale.phone")} value={phone} onChangeText={setPhone} keyboardType="phone-pad" testID="profile-phone" />
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
        {s.session?.user.email}
      </Text>
      <FormError message={error} />
      <Button mode="contained" onPress={save} loading={busy} disabled={busy} testID="profile-save">
        {t("rec.save")}
      </Button>

      <Card mode="outlined" style={{ borderRadius: 20, marginTop: 12 }}>
        <Card.Title title={t("profile.password")} titleVariant="titleMedium" />
        <Card.Content style={{ gap: 10 }}>
          <TextInput mode="outlined" label={t("profile.newPassword")} value={password} onChangeText={setPassword} secureTextEntry testID="profile-pw" />
          <TextInput mode="outlined" label={t("profile.repeatPassword")} value={password2} onChangeText={setPassword2} secureTextEntry testID="profile-pw2" />
          <FormError message={pwError} />
        </Card.Content>
        <Card.Actions>
          <Button mode="contained-tonal" onPress={changePassword} testID="profile-pw-save">
            {t("profile.changePassword")}
          </Button>
        </Card.Actions>
      </Card>

      <Card mode="outlined" style={{ borderRadius: 20, marginTop: 12, borderColor: theme.colors.error }}>
        <Card.Title title={t("profile.deleteTitle")} titleVariant="titleMedium" titleStyle={{ color: theme.colors.error }} />
        <Card.Content>
          <Text variant="bodyMedium">{t("profile.deleteBody")}</Text>
        </Card.Content>
        <Card.Actions>
          <Button mode="outlined" textColor={theme.colors.error} onPress={() => setDel(true)} testID="profile-delete">
            {t("profile.deleteButton")}
          </Button>
        </Card.Actions>
      </Card>

      <Portal>
        <Dialog visible={del} onDismiss={() => setDel(false)}>
          <Dialog.Title>{t("profile.deleteTitle")}</Dialog.Title>
          <Dialog.ScrollArea style={{ maxHeight: 460 }}>
          <ScrollView contentContainerStyle={{ gap: 10, paddingVertical: 8 }} keyboardShouldPersistTaps="handled">
            <Label>{t("profile.deleteReason")}</Label>
            <ChoiceChips options={DELETE_REASONS.map((r) => ({ value: r, label: t(`profile.reason.${r}`) }))} value={reason} onChange={(v) => setReason(v === reason ? "" : v)} testID="del-reason" />
            <TextInput mode="outlined" label={t("profile.deleteNote")} value={note} onChangeText={setNote} multiline maxLength={1000} testID="profile-delete-note" />
            <Text variant="bodyMedium">{t("profile.deleteConfirm", { word })}</Text>
            <TextInput mode="outlined" value={confirmWord} onChangeText={setConfirmWord} autoCapitalize="none" testID="profile-delete-word" />
            <FormError message={delError} />
          </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setDel(false)}>{t("common.cancel")}</Button>
            <Button textColor={theme.colors.error} onPress={deleteAccount} testID="profile-delete-confirm">
              {t("profile.deleteButton")}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <View style={{ height: 24 }} />
    </FormScreen>
  );
}
