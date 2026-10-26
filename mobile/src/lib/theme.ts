// Material 3 theme in FarmFlows green (tonal palette from the brand colour #047857),
// with Inter for English and Noto Sans Bengali for Bangla.
import { configureFonts, MD3DarkTheme, MD3LightTheme, type MD3Theme } from "react-native-paper";
import type { Locale } from "./i18n/core";

export const FONTS = {
  en: { 400: "Inter_400Regular", 500: "Inter_500Medium", 600: "Inter_600SemiBold", 700: "Inter_700Bold" },
  bn: { 400: "NotoSansBengali_400Regular", 500: "NotoSansBengali_500Medium", 600: "NotoSansBengali_600SemiBold", 700: "NotoSansBengali_700Bold" },
} as const;

const light = {
  primary: "#006C4C",
  onPrimary: "#FFFFFF",
  primaryContainer: "#89F8C7",
  onPrimaryContainer: "#002114",
  secondary: "#4C6358",
  onSecondary: "#FFFFFF",
  secondaryContainer: "#CEE9DA",
  onSecondaryContainer: "#092016",
  tertiary: "#3E6374",
  onTertiary: "#FFFFFF",
  tertiaryContainer: "#C2E8FC",
  onTertiaryContainer: "#001F2A",
  error: "#BA1A1A",
  onError: "#FFFFFF",
  errorContainer: "#FFDAD6",
  onErrorContainer: "#410002",
  background: "#F6FBF6",
  onBackground: "#171D1A",
  surface: "#F6FBF6",
  onSurface: "#171D1A",
  surfaceVariant: "#DBE5DD",
  onSurfaceVariant: "#404943",
  outline: "#707973",
  outlineVariant: "#BFC9C1",
  inverseSurface: "#2C322E",
  inverseOnSurface: "#EDF2ED",
  inversePrimary: "#6CDBAC",
  elevation: { level0: "transparent", level1: "#ECF5EF", level2: "#E5F1EA", level3: "#DEECE5", level4: "#DCEBE3", level5: "#D7E8E0" },
};

const dark = {
  primary: "#6CDBAC",
  onPrimary: "#003826",
  primaryContainer: "#005138",
  onPrimaryContainer: "#89F8C7",
  secondary: "#B3CCBF",
  onSecondary: "#1F352B",
  secondaryContainer: "#354B40",
  onSecondaryContainer: "#CEE9DA",
  tertiary: "#A6CCDF",
  onTertiary: "#083544",
  tertiaryContainer: "#254B5B",
  onTertiaryContainer: "#C2E8FC",
  error: "#FFB4AB",
  onError: "#690005",
  errorContainer: "#93000A",
  onErrorContainer: "#FFDAD6",
  background: "#0F1512",
  onBackground: "#DEE4DF",
  surface: "#0F1512",
  onSurface: "#DEE4DF",
  surfaceVariant: "#404943",
  onSurfaceVariant: "#BFC9C1",
  outline: "#8A938C",
  outlineVariant: "#404943",
  inverseSurface: "#DEE4DF",
  inverseOnSurface: "#2C322E",
  inversePrimary: "#006C4C",
  elevation: { level0: "transparent", level1: "#17201C", level2: "#1A2520", level3: "#1D2A24", level4: "#1E2C25", level5: "#203027" },
};

/** Every Material 3 text style in the right font file for its weight (Android can't fake weights well). */
function fontsFor(locale: Locale) {
  const base = MD3LightTheme.fonts;
  const fam = FONTS[locale];
  const config = Object.fromEntries(
    Object.entries(base).map(([variant, style]) => {
      const w = Number((style as { fontWeight?: string }).fontWeight ?? 400) as 400 | 500 | 600 | 700;
      return [variant, { ...style, fontFamily: fam[w] ?? fam[400], fontWeight: undefined }];
    }),
  );
  return configureFonts({ config });
}

export function makeTheme(dark_: boolean, locale: Locale): MD3Theme {
  const base = dark_ ? MD3DarkTheme : MD3LightTheme;
  return { ...base, roundness: 4, colors: { ...base.colors, ...(dark_ ? dark : light) }, fonts: fontsFor(locale) };
}
