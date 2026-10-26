import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/supabase/env";

/**
 * Supabase with the service-role key (SUPABASE_SERVICE_ROLE_KEY, server only):
 * for jobs with no signed-in person, such as confirming online payments and
 * sending reminders. Bypasses RLS, so every query must filter by farm / user.
 */
export function serviceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) return null;
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
