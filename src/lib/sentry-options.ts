// Shared Sentry settings. Sentry only starts when a DSN is set (see README → Error monitoring).

/** Server DSN (falls back to the public one, which is the same project). */
export const SERVER_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || "";

export function sentryOptions(dsn: string) {
  return {
    dsn,
    environment: process.env.VERCEL_ENV || process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
    // A small share of requests for performance traces; errors are always sent.
    tracesSampleRate: 0.1,
    // No IP addresses, cookies or request bodies: farm data stays out of the error reports.
    sendDefaultPii: false,
  };
}
