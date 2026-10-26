import { useRef, useState } from "react";
import { ScrollView, StyleSheet, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewInstance } from "react-native";
import { Button, Icon, Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Brand } from "@/components/brand";
import { LanguageToggle } from "@/components/language-toggle";
import type { MessageKey } from "@/lib/i18n/en";
import { usePrefs } from "@/lib/prefs";
import { useSession } from "@/lib/session";

type Slide = { icon: string; small: [string, string, string]; title: MessageKey; body: MessageKey };
const SLIDES: Slide[] = [
  { icon: "barn", small: ["cow", "sheep", "egg-outline"], title: "intro.s1.title", body: "intro.s1.body" },
  { icon: "clipboard-check-outline", small: ["water-outline", "egg-outline", "needle"], title: "intro.s2.title", body: "intro.s2.body" },
  { icon: "bell-ring-outline", small: ["needle", "heart-outline", "calendar-check"], title: "intro.s3.title", body: "intro.s3.body" },
  { icon: "chart-line", small: ["cash-multiple", "scale-balance", "trophy-outline"], title: "intro.s4.title", body: "intro.s4.body" },
];

/** The short guide shown the first time the app opens. */
export default function Intro() {
  const { t } = usePrefs();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { finishIntro } = useSession();
  const { width } = useWindowDimensions();
  const pager = useRef<ScrollViewInstance>(null);
  const [page, setPage] = useState(0);
  const last = page === SLIDES.length - 1;

  const goTo = (i: number) => {
    pager.current?.scrollTo({ x: i * width, animated: true });
    setPage(i);
  };
  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => setPage(Math.round(e.nativeEvent.contentOffset.x / width));

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]} testID="intro">
      <View style={styles.top}>
        <Brand size={32} />
        {!last && (
          <Button onPress={finishIntro} testID="intro-skip">
            {t("intro.skip")}
          </Button>
        )}
      </View>
      <View style={styles.lang}>
        <LanguageToggle />
      </View>

      <ScrollView
        ref={pager}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        scrollEventThrottle={16}
        style={styles.pager}
      >
        {SLIDES.map((s, i) => (
          <View key={s.title} style={[styles.slide, { width }]} accessibilityElementsHidden={i !== page} importantForAccessibility={i === page ? "auto" : "no-hide-descendants"}>
            <View style={[styles.art, { backgroundColor: theme.colors.primaryContainer }]}>
              <Icon source={s.icon} size={96} color={theme.colors.onPrimaryContainer} />
              {s.small.map((icon, k) => (
                <View
                  key={icon + k}
                  style={[
                    styles.bubble,
                    BUBBLES[k],
                    { backgroundColor: k === 1 ? theme.colors.tertiaryContainer : theme.colors.secondaryContainer, borderColor: theme.colors.background },
                  ]}
                >
                  <Icon source={icon} size={26} color={k === 1 ? theme.colors.onTertiaryContainer : theme.colors.onSecondaryContainer} />
                </View>
              ))}
            </View>
            <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]} accessibilityRole="header">
              {t(s.title)}
            </Text>
            <Text variant="bodyLarge" style={[styles.body, { color: theme.colors.onSurfaceVariant }]}>
              {t(s.body)}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots} accessibilityLabel={`${page + 1} / ${SLIDES.length}`}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, { width: i === page ? 24 : 8, backgroundColor: i === page ? theme.colors.primary : theme.colors.outlineVariant }]}
          />
        ))}
      </View>
      <View style={styles.actions}>
        <Button
          mode="contained"
          onPress={() => (last ? finishIntro() : goTo(page + 1))}
          contentStyle={styles.btn}
          labelStyle={styles.btnLabel}
          testID={last ? "intro-start" : "intro-next"}
        >
          {last ? t("intro.start") : t("intro.next")}
        </Button>
      </View>
    </View>
  );
}

const BUBBLES = [
  { top: 6, right: 4 },
  { bottom: 18, left: -6 },
  { bottom: -4, right: 26 },
] as const;

const styles = StyleSheet.create({
  root: { flex: 1 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, minHeight: 48 },
  lang: { paddingHorizontal: 20, marginTop: 8, alignSelf: "center", width: "100%", maxWidth: 320 },
  pager: { flex: 1 },
  slide: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  art: { width: 220, height: 220, borderRadius: 110, alignItems: "center", justifyContent: "center", marginBottom: 36 },
  bubble: { position: "absolute", width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", borderWidth: 4 },
  title: { textAlign: "center", maxWidth: 440 },
  body: { textAlign: "center", marginTop: 12, maxWidth: 440, lineHeight: 26 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginBottom: 20 },
  dot: { height: 8, borderRadius: 4 },
  actions: { paddingHorizontal: 20, width: "100%", maxWidth: 520, alignSelf: "center" },
  btn: { height: 52 },
  btnLabel: { fontSize: 16 },
});
