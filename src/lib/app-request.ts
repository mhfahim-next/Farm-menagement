import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";
import type { Locale } from "@/lib/i18n/core";

/**
 * A request from the Android app. The app sends the person's Supabase session
 * as a bearer token (no cookies); inside `runAsApp` the usual helpers
 * (createClient, requireFarm, getI18n…) use that token, the farm the app is
 * showing and the app's language, so API routes can run the website's own
 * server actions. Row-level security applies exactly as on the website.
 * Only code inside `runAsApp` (the /api/app routes) ever sees this; a header
 * on any other request changes nothing.
 */
export type AppRequest = { token: string; farmId: string | null; locale: Locale };

const store = new AsyncLocalStorage<AppRequest>();

export const appRequest = () => store.getStore() ?? null;

export function runAsApp<T>(ctx: AppRequest, fn: () => Promise<T>) {
  return store.run(ctx, fn);
}

/** The user id inside the app's token (not verified; callers verify with getUser). */
export function tokenUserId(token: string) {
  try {
    const sub = JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf8")).sub;
    return typeof sub === "string" ? sub : null;
  } catch {
    return null;
  }
}
