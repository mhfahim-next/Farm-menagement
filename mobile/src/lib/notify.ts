// Reminder notifications on the phone (scheduled on the phone itself, so they
// work without a push server). Off until the person turns them on in More.
import * as Notifications from "expo-notifications";
import { AndroidImportance } from "expo-notifications";
import { Platform } from "react-native";
import type { PlannedNote } from "./notify-plan";
import { getItem, setItem } from "./storage";

const KEY = "ff.notify";
const CHANNEL = "reminders";

export const notifySupported = Platform.OS === "android" || Platform.OS === "ios";
export const notifyOn = () => notifySupported && getItem(KEY) === "1";

// Screens re-plan when notifications are turned on or off.
let version = 0;
const listeners = new Set<() => void>();
const changed = () => {
  version++;
  listeners.forEach((l) => l());
};
export const notifyStore = {
  subscribe: (l: () => void) => (listeners.add(l), () => void listeners.delete(l)),
  get: () => version,
};

if (notifySupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
}

/** Asks for permission; true when notifications are now on. */
export async function enableNotifications(channelName: string) {
  if (!notifySupported) return false;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL, { name: channelName, importance: AndroidImportance.HIGH, lightColor: "#047857" });
  }
  const current = await Notifications.getPermissionsAsync();
  const granted = current.granted || (await Notifications.requestPermissionsAsync()).granted;
  setItem(KEY, granted ? "1" : null);
  changed();
  return granted;
}

export async function disableNotifications() {
  setItem(KEY, null);
  changed();
  if (notifySupported) await Notifications.cancelAllScheduledNotificationsAsync();
}

/** Replaces everything scheduled with this plan. */
export async function schedule(plan: PlannedNote[]) {
  if (!notifyOn()) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const n of plan) {
    await Notifications.scheduleNotificationAsync({
      identifier: n.id,
      content: { title: n.title, body: n.body, data: { url: n.url } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: n.at, channelId: CHANNEL },
    });
  }
}

/** Today's milk or eggs were entered: no evening reminder. */
export async function cancelEvening() {
  if (notifyOn()) await Notifications.cancelScheduledNotificationAsync("evening").catch(() => {});
}

/** Opens the screen a tapped notification points to. */
export function onNotificationTap(open: (url: string) => void) {
  if (!notifySupported) return () => {};
  const sub = Notifications.addNotificationResponseReceivedListener((r) => {
    const url = r.notification.request.content.data?.url;
    if (typeof url === "string") open(url);
  });
  return () => sub.remove();
}
