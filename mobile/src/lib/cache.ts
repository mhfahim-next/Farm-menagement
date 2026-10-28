// Lists read from the server are also kept on the phone, so screens open at
// once and still work without internet (showing what was last loaded).
import { useCallback, useEffect, useState } from "react";
import { isNetworkError } from "./entries";
import { getItem, setItem } from "./storage";

// Bump the version when the shape of saved data changes, so a copy saved by
// an older app version is never read by a newer screen (that crashed the
// animal page after an update).
const VERSION = 2;
const PREFIX = `ff.cache.v${VERSION}.`;

/** Drops copies saved by older versions of the app (they can't be read any more). */
export function dropOldCache() {
  try {
    const store = globalThis.localStorage;
    if (!store) return;
    const old: string[] = [];
    for (let i = 0; i < store.length; i++) {
      const k = store.key(i);
      if (k?.startsWith("ff.cache.") && !k.startsWith(PREFIX)) old.push(k);
    }
    old.forEach((k) => store.removeItem(k));
  } catch {
    // storage unavailable: nothing to clean
  }
}

/** Drops every saved copy (on sign out, so the next person on this phone sees nothing of it). */
export function clearCache() {
  try {
    const store = globalThis.localStorage;
    if (!store) return;
    const keys: string[] = [];
    for (let i = 0; i < store.length; i++) {
      const k = store.key(i);
      if (k?.startsWith("ff.cache.")) keys.push(k);
    }
    keys.forEach((k) => store.removeItem(k));
  } catch {
    // storage unavailable: nothing to clear
  }
}

export function readCache<T>(key: string): T | null {
  try {
    const v = getItem(PREFIX + key);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}

export const writeCache = (key: string, v: unknown) => setItem(PREFIX + key, JSON.stringify(v));

/**
 * Data for `key`: the saved copy first, then fresh from the server.
 * `offline` is true when the server could not be reached, `error` holds the
 * server's reason when it answered with one (the saved copy stays either way).
 */
export function useCached<T>(key: string | null, fetcher: () => Promise<T>) {
  type State = { key: string | null; data: T | null; offline: boolean; error: string | null; loading: boolean };
  const start = (k: string | null): State => ({ key: k, data: k ? readCache<T>(k) : null, offline: false, error: null, loading: Boolean(k) });
  const [state, setState] = useState<State>(() => start(key));
  // A different key (another farm): start from that key's saved copy.
  if (state.key !== key) setState(start(key));

  const load = useCallback(async () => {
    if (!key) return;
    try {
      const data = await fetcher();
      writeCache(key, data);
      setState({ key, data, offline: false, error: null, loading: false });
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      const offline = isNetworkError(err);
      setState((s) => (s.key === key ? { ...s, offline, error: offline ? null : err.message, loading: false } : s));
    }
    // fetcher changes with every render; the key decides what is loaded
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.resolve();
      if (!cancelled) await load();
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  return { data: state.data, offline: state.offline, error: state.error, loading: state.loading && state.data === null, reload: load };
}
