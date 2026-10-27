import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, Text, useTheme } from "react-native-paper";
import { FormError } from "@/components/form-error";
import { finishSignIn } from "@/lib/auth";
import { usePrefs } from "@/lib/prefs";
import { supabase } from "@/lib/supabase";

/**
 * Where Google sign-in comes back to (farmflows://auth/callback?code=…).
 * Android opens this address in the app too, so it signs in and moves on
 * instead of showing "page not found".
 */
export default function AuthCallback() {
  const { t } = usePrefs();
  const theme = useTheme();
  const params = useLocalSearchParams<{ code?: string; error_description?: string; error?: string }>();
  const [state, setState] = useState<{ done: boolean; error: string | null }>({ done: false, error: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const error = params.code ? await finishSignIn(params.code) : (params.error_description ?? params.error ?? null);
      // The code may already have been used by the sign-in sheet: fine if a session exists.
      const { data } = await supabase.auth.getSession();
      if (!cancelled) setState({ done: true, error: data.session ? null : error });
    })();
    return () => {
      cancelled = true;
    };
  }, [params.code, params.error, params.error_description]);

  if (state.done && !state.error) return <Redirect href="/" />;
  return (
    <View style={[styles.box, { backgroundColor: theme.colors.background }]} testID="auth-callback">
      {state.error ? (
        <>
          <FormError message={t("auth.err.google")} detail={state.error} />
          <Button mode="contained" onPress={() => router.replace("/")} testID="callback-back">
            {t("animal.back")}
          </Button>
        </>
      ) : (
        <>
          <ActivityIndicator size="large" />
          <Text variant="bodyLarge">{t("common.loading")}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, alignItems: "stretch", justifyContent: "center", gap: 16, padding: 24 },
});
