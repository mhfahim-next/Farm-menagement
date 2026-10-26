// Public settings baked into the app at build time (EXPO_PUBLIC_*; see .env.example).
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const SITE_URL = (process.env.EXPO_PUBLIC_SITE_URL ?? "https://www.farmflows.app").replace(/\/$/, "");

export const siteLink = (path: string) => `${SITE_URL}${path}`;
