import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "./env";

/**
 * Cookie-free client for public data (plans, dropdowns, published blog posts).
 * Because it does not read the request, its results can be cached across
 * visitors (see unstable_cache in lib/public-data.ts).
 */
export function createPublicClient() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
