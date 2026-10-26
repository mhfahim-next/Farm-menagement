import { SegmentedButtons } from "react-native-paper";
import { usePrefs } from "@/lib/prefs";

/** বাংলা / English switch. */
export function LanguageToggle({ style }: { style?: object }) {
  const { locale, setLocale } = usePrefs();
  return (
    <SegmentedButtons
      style={style}
      density="small"
      value={locale}
      onValueChange={(v) => setLocale(v === "bn" ? "bn" : "en")}
      buttons={[
        { value: "bn", label: "বাংলা", testID: "lang-bn" },
        { value: "en", label: "English", testID: "lang-en" },
      ]}
    />
  );
}
