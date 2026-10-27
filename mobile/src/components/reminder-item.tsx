import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { List, IconButton, useTheme } from "react-native-paper";
import { siteLink } from "@/lib/env";
import { usePrefs } from "@/lib/prefs";
import { appRoute, type AppReminder } from "@/lib/reminders";

const ICON: Record<string, string> = {
  vaccine: "needle",
  flock_vaccine: "needle",
  breeding: "heart-pulse",
  low_stock: "package-variant",
  buyer_due: "cash-clock",
  milk_missing: "water-outline",
  eggs_missing: "egg-outline",
  broiler_weigh: "scale",
  broiler_sale: "cart-outline",
  fatten_countdown: "calendar-star",
  fatten_weigh: "weight-kilogram",
  plan_expiry: "star-outline",
};

/** One reminder: what, when, a colour for how urgent, and a tick to mark it done. */
export function ReminderItem({ r, onDone }: { r: AppReminder; onDone?: () => void }) {
  const theme = useTheme();
  const { t } = usePrefs();
  const color = r.tone === "red" ? theme.colors.error : r.tone === "amber" ? "#b45309" : theme.colors.primary;
  const open = () => {
    const to = appRoute(r.href);
    if (to) router.push(to as never);
    else WebBrowser.openBrowserAsync(siteLink(r.href));
  };
  return (
    <List.Item
      title={r.title}
      titleNumberOfLines={2}
      description={r.when}
      descriptionStyle={{ color, fontWeight: "600" }}
      onPress={open}
      left={(p) => <List.Icon {...p} icon={ICON[r.kind] ?? "bell-outline"} color={color} />}
      right={onDone ? () => <IconButton icon="check-circle-outline" onPress={onDone} accessibilityLabel={t("rem.done")} testID={`done-${r.key}`} /> : undefined}
      testID={`rem-${r.kind}`}
    />
  );
}
