import { Link } from "expo-router";
import { useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Button, Divider, Text, TextInput, useTheme } from "react-native-paper";
import { Brand } from "@/components/brand";
import { FormError } from "@/components/form-error";
import { LanguageToggle } from "@/components/language-toggle";
import { Screen } from "@/components/screen";
import { authErrorKey, errorDetail, isEmail, signInWithGoogle } from "@/lib/auth";
import { usePrefs } from "@/lib/prefs";
import { configured, supabase } from "@/lib/supabase";

export default function Login() {
  const { t } = usePrefs();
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState<"email" | "google" | null>(null);
  const [error, setError] = useState<string | null>(configured ? null : t("common.notConfigured"));
  const [detail, setDetail] = useState<string | null>(null);

  const submit = async () => {
    if (!isEmail(email)) return setError(t("auth.err.email"));
    if (!password) return setError(t("auth.err.invalid"));
    setError(null);
    setDetail(null);
    setBusy("email");
    const { error: e } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(null);
    // On success the session changes and the app moves on by itself.
    if (e) {
      setError(t(authErrorKey(e)));
      setDetail(errorDetail(e));
    }
  };

  const google = async () => {
    setError(null);
    setDetail(null);
    setBusy("google");
    const r = await signInWithGoogle().catch((e: unknown) => ({ status: "error" as const, detail: e instanceof Error ? e.message : undefined }));
    setBusy(null);
    if (r.status === "error") {
      setError(t("auth.err.google"));
      setDetail(r.detail ?? null);
    }
  };

  return (
    <Screen testID="login">
      <View style={styles.header}>
        <Brand />
        <LanguageToggle style={styles.lang} />
      </View>
      <Text variant="headlineMedium" style={{ color: theme.colors.onBackground }} accessibilityRole="header">
        {t("auth.loginTitle")}
      </Text>
      <Text variant="bodyLarge" style={[styles.sub, { color: theme.colors.onSurfaceVariant }]}>
        {t("auth.loginSub")}
      </Text>

      <View style={styles.form}>
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
          autoComplete="current-password"
          textContentType="password"
          onSubmitEditing={submit}
          left={<TextInput.Icon icon="lock-outline" />}
          right={<TextInput.Icon icon={show ? "eye-off-outline" : "eye-outline"} onPress={() => setShow(!show)} accessibilityLabel={show ? t("auth.hidePassword") : t("auth.showPassword")} />}
          testID="password"
        />
        <FormError message={error} detail={detail} />
        <Button mode="contained" onPress={submit} loading={busy === "email"} disabled={busy !== null} contentStyle={styles.btn} testID="login-submit">
          {t("auth.login")}
        </Button>
        <Link href="/forgot" asChild>
          <Button mode="text" style={styles.right}>
            {t("auth.forgot")}
          </Button>
        </Link>

        {Platform.OS !== "web" && (
          <View style={styles.or}>
            <Divider style={styles.flex} />
            <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
              {t("auth.or")}
            </Text>
            <Divider style={styles.flex} />
          </View>
        )}
        {Platform.OS !== "web" && (
          <Button mode="outlined" icon="google" onPress={google} loading={busy === "google"} disabled={busy !== null} contentStyle={styles.btn}>
            {t("auth.google")}
          </Button>
        )}
      </View>

      <View style={styles.bottom}>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          {t("auth.noAccount")}
        </Text>
        <Link href="/signup" asChild>
          <Button mode="contained-tonal" contentStyle={styles.btn} testID="go-signup">
            {t("auth.createAccount")}
          </Button>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 16, marginBottom: 32, marginTop: 8 },
  lang: { alignSelf: "flex-start", minWidth: 220 },
  sub: { marginTop: 6 },
  form: { gap: 12, marginTop: 24 },
  btn: { height: 50 },
  right: { alignSelf: "flex-end" },
  or: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 4 },
  flex: { flex: 1 },
  bottom: { marginTop: "auto", paddingTop: 32, gap: 10, alignItems: "stretch" },
});
