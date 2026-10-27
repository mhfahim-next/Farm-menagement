// Public settings baked into the app at build time (EXPO_PUBLIC_*; see .env.example).

/** A pasted value without stray spaces or quotes around it. */
export const cleanValue = (v: string | undefined) => (v ?? "").trim().replace(/^["']+|["']+$/g, "").trim();

/**
 * Only the project address (https://xxx.supabase.co). Supabase's dashboard also
 * shows longer addresses such as https://xxx.supabase.co/rest/v1/; with a path
 * left on, sign-in requests go to the wrong place and fail.
 */
export function supabaseOrigin(v: string | undefined) {
  const s = cleanValue(v);
  if (!s) return "";
  try {
    const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
    return u.origin;
  } catch {
    return "";
  }
}

export const SUPABASE_URL = supabaseOrigin(process.env.EXPO_PUBLIC_SUPABASE_URL);
export const SUPABASE_ANON_KEY = cleanValue(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
export const SITE_URL = (cleanValue(process.env.EXPO_PUBLIC_SITE_URL) || "https://www.farmflows.app").replace(/\/+$/, "");

export const siteLink = (path: string) => `${SITE_URL}${path}`;
