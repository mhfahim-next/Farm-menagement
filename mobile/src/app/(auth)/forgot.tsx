import { Link } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";
import { FormError } from "@/components/form-error";
import { Screen } from "@/components/screen";
import { authErrorKey, isEmail } from "@/lib/auth";
import { siteLink } from "@/lib/env";
import { usePrefs } from "@/lib/prefs";
import { supabase } from "@/lib/supabase";

/** Sends the reset email; its link opens the website, where the new password is set. */
export default function Forgot() {
  const { t } = usePrefs();
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  const submit = async () => {
    if (!isEmail(email)) return setError(t("auth.err.email"));
    setError(null);
    setBusy(true);
    const { error: e } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: siteLink("/dashboard/profile") });
    setBusy(false);
    if (e && authErrorKey(e) === "common.network") return setError(t("common.network"));
    // Same answer whether or not the address has an account.
    setSent(email.trim());
  };

  return (
    <Screen testID="forgot">
      <Link href="/login" asChild>
        <Button icon="arrow-left" style={styles.back} mode="text">
          {t("auth.backToLogin")}
        </Button>
      </Link>
      <Text variant="headlineMedium" style={{ color: theme.colors.onBackground }} accessibilityRole="header">
        {t("auth.forgotTitle")}
      </Text>
      <Text variant="bodyLarge" style={[styles.sub, { color: theme.colors.onSurfaceVariant }]}>
        {t("auth.forgotBody")}
      </Text>
      <View style={styles.form}>
        {sent ? (
          <View style={[styles.done, { backgroundColor: theme.colors.primaryContainer }]} accessibilityLiveRegion="polite">
            <Text variant="bodyLarge" style={{ color: theme.colors.onPrimaryContainer }}>
              {t("auth.linkSent", { email: sent })}
            </Text>
          </View>
        ) : (
          <>
            <TextInput
              mode="outlined"
              label={t("auth.email")}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              left={<TextInput.Icon icon="email-outline" />}
              onSubmitEditing={submit}
            />
            <FormError message={error} />
            <Button mode="contained" onPress={submit} loading={busy} disabled={busy} contentStyle={styles.btn}>
              {t("auth.sendLink")}
            </Button>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { alignSelf: "flex-start", marginLeft: -12, marginBottom: 16 },
  sub: { marginTop: 6 },
  form: { gap: 12, marginTop: 24 },
  btn: { height: 50 },
  done: { padding: 16, borderRadius: 16 },
});
