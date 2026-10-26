// Small key-value settings kept on the phone (intro seen, language, current farm).
// expo-sqlite provides localStorage on Android / iOS; the browser has its own.
import "expo-sqlite/localStorage/install";

export const KEYS = {
  introSeen: "ff.introSeen",
  locale: "ff.locale",
  theme: "ff.theme",
  farm: "ff.farm",
  planPending: "ff.planPending",
} as const;

export function getItem(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function setItem(key: string, value: string | null) {
  try {
    if (value === null) globalThis.localStorage?.removeItem(key);
    else globalThis.localStorage?.setItem(key, value);
  } catch {
    // storage full or unavailable: settings just aren't remembered
  }
}
