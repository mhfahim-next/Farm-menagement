import * as Sentry from "@sentry/nextjs";
import { SERVER_DSN } from "@/lib/sentry-options";

/** Starts server-side error monitoring when a Sentry DSN is set. */
export async function register() {
  if (!SERVER_DSN) return;
  if (process.env.NEXT_RUNTIME === "nodejs") await import("./sentry.server.config");
  if (process.env.NEXT_RUNTIME === "edge") await import("./sentry.edge.config");
}

/** Errors in pages, server actions and route handlers (does nothing until Sentry is started). */
export const onRequestError = Sentry.captureRequestError;
