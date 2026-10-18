/** Public site URL (set NEXT_PUBLIC_SITE_URL in production, e.g. https://farmflows.app). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
export const SITE_NAME = "FarmFlows";
