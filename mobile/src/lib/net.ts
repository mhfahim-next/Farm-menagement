// Whether the phone has internet, and a signal when it comes back (to send
// what waits on the phone and to refresh what screens show at once).
import * as Network from "expo-network";
import { useSyncExternalStore } from "react";

let online = true;
const listeners = new Set<() => void>();
const reconnect = new Set<() => void>();

const connected = (s: Network.NetworkState) => s.isConnected !== false && s.isInternetReachable !== false;

function set(next: boolean) {
  if (next === online) return;
  online = next;
  listeners.forEach((f) => f());
  if (next) reconnect.forEach((f) => f());
}

let started = false;
function start() {
  if (started) return;
  started = true;
  try {
    Network.getNetworkStateAsync().then((s) => set(connected(s)), () => {});
    Network.addNetworkStateListener((s) => set(connected(s)));
  } catch {
    // no network module (tests): taken as online
  }
}

/** False only when the phone knows it has no connection (a request can still fail when true). */
export function isOnline() {
  start();
  return online;
}

export function useOnline() {
  start();
  return useSyncExternalStore(
    (f) => {
      listeners.add(f);
      return () => listeners.delete(f);
    },
    () => online,
    () => true,
  );
}

/** Runs `fn` each time the connection comes back. Returns the unsubscribe. */
export function onReconnect(fn: () => void) {
  start();
  reconnect.add(fn);
  return () => {
    reconnect.delete(fn);
  };
}
