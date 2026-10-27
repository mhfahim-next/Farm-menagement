import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import {
  NotoSansBengali_400Regular,
  NotoSansBengali_500Medium,
  NotoSansBengali_600SemiBold,
  NotoSansBengali_700Bold,
} from "@expo-google-fonts/noto-sans-bengali";
import { useFonts } from "expo-font";
import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo } from "react";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ScreenError } from "@/components/screen-error";
import { dropOldCache } from "@/lib/cache";
import { onNotificationTap } from "@/lib/notify";
import { OutboxProvider } from "@/lib/outbox";
import { PrefsProvider, usePrefs } from "@/lib/prefs";
import { ToastProvider } from "@/lib/toast";
import { SessionProvider, useSession } from "@/lib/session";
import { makeTheme } from "@/lib/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});
dropOldCache();

// A screen that fails shows a "try again" page instead of closing the app.
export const ErrorBoundary = ScreenError;

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
          <OutboxProvider>
            <App fontsReady={fontsLoaded || Boolean(fontError)} />
          </OutboxProvider>
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
      colors: {
        ...base.colors,
        primary: theme.colors.primary,
        background: theme.colors.background,
        card: theme.colors.surface,
        text: theme.colors.onSurface,
        border: theme.colors.outlineVariant,
      },
    };
  }, [dark, theme]);
  const ready = fontsReady && s.ready;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);
  // A tapped reminder notification opens its screen.
  useEffect(() => onNotificationTap((url) => router.push(url as never)), []);
  if (!ready) return null;

  const signedIn = Boolean(s.session);
  const hasFarm = s.memberships.length > 0;
  return (
    <PaperProvider theme={theme}>
      <ToastProvider>
        <ThemeProvider value={navTheme}>
          <StatusBar style={dark ? "light" : "dark"} />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background }, animation: "fade_from_bottom" }}>
            <Stack.Screen name="index" />
            {/* Google sign-in comes back here, signed in or not. */}
            <Stack.Screen name="auth/callback" />
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
              <Stack.Screen name="animal/[id]" options={{ animation: "slide_from_right" }} />
              <Stack.Screen name="buyer/[id]" options={{ animation: "slide_from_right" }} />
              <Stack.Screen name="record/health" />
              <Stack.Screen name="record/breeding" />
              <Stack.Screen name="record/sale" />
              <Stack.Screen name="record/payment" />
              <Stack.Screen name="record/buyer" />
              <Stack.Screen name="record/animal" />
              <Stack.Screen name="record/weight" />
              <Stack.Screen name="fattening" options={{ animation: "slide_from_right" }} />
              <Stack.Screen name="flocks" options={{ animation: "slide_from_right" }} />
              <Stack.Screen name="flock/[id]" options={{ animation: "slide_from_right" }} />
              <Stack.Screen name="record/flock" />
              <Stack.Screen name="record/flock-health" />
              <Stack.Screen name="profile" />
              <Stack.Screen name="settings" />
              <Stack.Screen name="record/farm" />
              <Stack.Screen name="reminders" options={{ animation: "slide_from_right" }} />
              <Stack.Screen name="scan" />
              <Stack.Screen name="record/expense" />
              <Stack.Screen name="profit" options={{ animation: "slide_from_right" }} />
              <Stack.Screen name="stock/index" options={{ animation: "slide_from_right" }} />
              <Stack.Screen name="stock/[id]" options={{ animation: "slide_from_right" }} />
              <Stack.Screen name="record/stock-item" />
              <Stack.Screen name="record/stock-move" />
              <Stack.Screen name="staff/index" options={{ animation: "slide_from_right" }} />
              <Stack.Screen name="staff/[id]" options={{ animation: "slide_from_right" }} />
              <Stack.Screen name="staff/attendance" />
              <Stack.Screen name="record/staff" />
              <Stack.Screen name="record/staff-pay" />
              <Stack.Screen name="team" options={{ animation: "slide_from_right" }} />
              <Stack.Screen name="reports" options={{ animation: "slide_from_right" }} />
              <Stack.Screen name="approvals" options={{ animation: "slide_from_right" }} />
              <Stack.Screen name="doctor" options={{ animation: "slide_from_right" }} />
              <Stack.Screen name="entry/milk" />
              <Stack.Screen name="entry/birds" />
            </Stack.Protected>
          </Stack>
        </ThemeProvider>
      </ToastProvider>
    </PaperProvider>
  );
}
