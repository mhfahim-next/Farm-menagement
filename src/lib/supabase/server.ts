import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient as createTokenClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { appRequest } from "@/lib/app-request";
import { SUPABASE_KEY, SUPABASE_URL } from "./env";

function cookieClient(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // The proxy refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}

export async function createClient() {
  // A request from the app (see lib/app-request): the person's own session
  // token instead of cookies. Same client API, same row-level security.
  const app = appRequest();
  if (app) {
    return createTokenClient(SUPABASE_URL, SUPABASE_KEY, {
      global: { headers: { Authorization: `Bearer ${app.token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    }) as unknown as ReturnType<typeof cookieClient>;
  }
  return cookieClient(await cookies());
}
