import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import {
  NotoSansBengali_400Regular,
  NotoSansBengali_500Medium,
  NotoSansBengali_600SemiBold,
  NotoSansBengali_700Bold,
} from "@expo-google-fonts/noto-sans-bengali";
import { useFonts } from "expo-font";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo } from "react";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PrefsProvider, usePrefs } from "@/lib/prefs";
import { SessionProvider, useSession } from "@/lib/session";
import { makeTheme } from "@/lib/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    NotoSansBengali_400Regular,
    NotoSansBengali_500Medium,
    NotoSansBengali_600SemiBold,
    NotoSansBengali_700Bold,
  });
  return (
    <SafeAreaProvider>
      <PrefsProvider>
        <SessionProvider>
          <App fontsReady={fontsLoaded || Boolean(fontError)} />
        </SessionProvider>
      </PrefsProvider>
    </SafeAreaProvider>
  );
}

function App({ fontsReady }: { fontsReady: boolean }) {
  const { dark, locale } = usePrefs();
  const s = useSession();
  const theme = useMemo(() => makeTheme(dark, locale), [dark, locale]);
  const navTheme = useMemo(() => {
    const base = dark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: { ...base.colors, primary: theme.colors.primary, background: theme.colors.background, card: theme.colors.surface, text: theme.colors.onSurface, border: theme.colors.outlineVariant },
    };
  }, [dark, theme]);
  const ready = fontsReady && s.ready;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);
  if (!ready) return null;

  const signedIn = Boolean(s.session);
  const hasFarm = s.memberships.length > 0;
  return (
    <PaperProvider theme={theme}>
      <ThemeProvider value={navTheme}>
        <StatusBar style={dark ? "light" : "dark"} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background }, animation: "fade_from_bottom" }}>
          <Stack.Screen name="index" />
          {/* First launch: a short guide, then sign in. */}
          <Stack.Protected guard={!s.introSeen}>
            <Stack.Screen name="intro" />
          </Stack.Protected>
          <Stack.Protected guard={s.introSeen && !signedIn}>
            <Stack.Screen name="(auth)" />
          </Stack.Protected>
          {/* New account: create the farm, then choose a plan. */}
          <Stack.Protected guard={signedIn && (!hasFarm || s.planPending)}>
            <Stack.Screen name="onboarding" />
          </Stack.Protected>
          <Stack.Protected guard={signedIn && hasFarm && !s.planPending}>
            <Stack.Screen name="(tabs)" />
          </Stack.Protected>
        </Stack>
      </ThemeProvider>
    </PaperProvider>
  );
}
