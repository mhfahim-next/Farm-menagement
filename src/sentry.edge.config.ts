import * as Sentry from "@sentry/nextjs";
import { SERVER_DSN, sentryOptions } from "@/lib/sentry-options";

Sentry.init(sentryOptions(SERVER_DSN));
