// Browser error monitoring. Sentry is only downloaded when a DSN is set, and
// then after the page has started, so it never slows down the first view.
import { sentryOptions } from "@/lib/sentry-options";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
let onNavigate: ((href: string, navigationType: string) => void) | null = null;

if (dsn) {
  import("@sentry/nextjs")
    .then((Sentry) => {
      Sentry.init(sentryOptions(dsn));
      onNavigate = Sentry.captureRouterTransitionStart;
    })
    .catch(() => {
      // monitoring must never break the app
    });
}

/** Lets Sentry time page-to-page navigations (once it has loaded). */
export function onRouterTransitionStart(href: string, navigationType: string) {
  onNavigate?.(href, navigationType);
}
