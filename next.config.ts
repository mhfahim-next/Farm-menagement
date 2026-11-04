import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";
import { securityHeaders } from "./src/lib/security-headers";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: { formats: ["image/avif", "image/webp"] },
  experimental: {
    // Import only the parts of these libraries a page actually uses.
    optimizePackageImports: ["motion"],
  },
  async headers() {
    return [
      {
        // The service worker must never be served from a stale cache.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        // Logos and app icons: cache for a week, refresh in the background.
        source: "/:dir(brand|icons)/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
      {
        source: "/:path*",
        headers: securityHeaders({
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
          dev: process.env.NODE_ENV === "development",
          enforce: process.env.CSP_ENFORCE === "1",
        }),
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

// With a Sentry auth token (build-time only), source maps are uploaded so error
// reports show the real code lines. Without one, the app builds exactly as before.
export default process.env.SENTRY_AUTH_TOKEN
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: !process.env.CI,
      telemetry: false,
      widenClientFileUpload: true,
    })
  : nextConfig;
