import { Link, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Dialog, Portal, Text, TextInput, useTheme } from "react-native-paper";
import { Brand } from "@/components/brand";
import { FormError } from "@/components/form-error";
import { Screen } from "@/components/screen";
import { authErrorKey, isEmail } from "@/lib/auth";
import { siteLink } from "@/lib/env";
import { usePrefs } from "@/lib/prefs";
import { supabase } from "@/lib/supabase";

export default function Signup() {
  const { t } = usePrefs();
  const theme = useTheme();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmFor, setConfirmFor] = useState<string | null>(null);

  const submit = async () => {
    if (name.trim().length < 2) return setError(t("auth.err.name"));
    if (!isEmail(email)) return setError(t("auth.err.email"));
    if (password.length < 8) return setError(t("auth.err.weak"));
    setError(null);
    setBusy(true);
    const { data, error: e } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: name.trim() } },
    });
    setBusy(false);
    if (e) return setError(t(authErrorKey(e)));
    // With email confirmation on, Supabase returns no session (and no identities for an existing address).
    if (!data.session) {
      if (data.user && data.user.identities?.length === 0) return setError(t("auth.err.taken"));
      setConfirmFor(email.trim());
    }
    // With a session the app moves on to farm setup by itself.
  };

  return (
    <Screen testID="signup">
      <View style={styles.header}>
        <Brand size={44} />
      </View>
      <Text variant="headlineMedium" style={{ color: theme.colors.onBackground }} accessibilityRole="header">
        {t("auth.signupTitle")}
      </Text>
      <Text variant="bodyLarge" style={[styles.sub, { color: theme.colors.onSurfaceVariant }]}>
        {t("auth.signupSub")}
      </Text>
      <View style={styles.form}>
        <TextInput mode="outlined" label={t("auth.fullName")} value={name} onChangeText={setName} autoComplete="name" textContentType="name" left={<TextInput.Icon icon="account-outline" />} testID="full-name" />
        <TextInput
          mode="outlined"
          label={t("auth.email")}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          left={<TextInput.Icon icon="email-outline" />}
          testID="email"
        />
        <TextInput
          mode="outlined"
          label={t("auth.password")}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!show}
          autoComplete="new-password"
          textContentType="newPassword"
          onSubmitEditing={submit}
          left={<TextInput.Icon icon="lock-outline" />}
          right={<TextInput.Icon icon={show ? "eye-off-outline" : "eye-outline"} onPress={() => setShow(!show)} accessibilityLabel={show ? t("auth.hidePassword") : t("auth.showPassword")} />}
          testID="password"
        />
        <FormError message={error} />
        <Button mode="contained" onPress={submit} loading={busy} disabled={busy} contentStyle={styles.btn} testID="signup-submit">
          {t("auth.signup")}
        </Button>
        <Text variant="bodySmall" style={[styles.terms, { color: theme.colors.onSurfaceVariant }]}>
          {t("auth.terms")}{" "}
          <Text variant="bodySmall" style={{ color: theme.colors.primary }} onPress={() => WebBrowser.openBrowserAsync(siteLink("/terms"))}>
            {t("auth.termsLink")}
          </Text>
          {" · "}
          <Text variant="bodySmall" style={{ color: theme.colors.primary }} onPress={() => WebBrowser.openBrowserAsync(siteLink("/privacy"))}>
            {t("auth.privacyLink")}
          </Text>
        </Text>
      </View>
      <View style={styles.bottom}>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          {t("auth.haveAccount")}
        </Text>
        <Link href="/login" asChild>
          <Button mode="text">{t("auth.login")}</Button>
        </Link>
      </View>

      <Portal>
        <Dialog visible={confirmFor !== null} onDismiss={() => setConfirmFor(null)}>
          <Dialog.Icon icon="email-check-outline" />
          <Dialog.Title style={styles.center}>{t("auth.checkEmailTitle")}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">{t("auth.checkEmailBody", { email: confirmFor ?? "" })}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setConfirmFor(null);
                router.replace("/login");
              }}
            >
              {t("auth.backToLogin")}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 24, marginTop: 8 },
  sub: { marginTop: 6 },
  form: { gap: 12, marginTop: 24 },
  btn: { height: 50 },
  terms: { textAlign: "center", lineHeight: 18 },
  bottom: { marginTop: "auto", paddingTop: 24, flexDirection: "row", alignItems: "center", justifyContent: "center", flexWrap: "wrap" },
  center: { textAlign: "center" },
});
