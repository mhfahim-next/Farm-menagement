import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createI18n, isLocale } from "@/lib/i18n/core";
import { messagesFor } from "@/lib/i18n/server";
import { getCachedOptionRows } from "@/lib/public-data";
import { reminderText } from "@/lib/reminders";
import { loadMyReminders } from "@/lib/reminders-data";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/env";
import type { Role } from "@/lib/types";

// The Android app's reminders: the same list as the bell on the website, in
// the app's language. The app sends its Supabase session as
// "Authorization: Bearer <access token>"; everything is read with that
// person's own rights (row-level security), never with a service key.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { ...CORS, "Cache-Control": "no-store" } });

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function GET(request: Request) {
  const token = /^Bearer (.+)$/.exec(request.headers.get("authorization") ?? "")?.[1];
  if (!token) return json({ error: "Sign in first." }, 401);
  const url = new URL(request.url);
  const farmId = url.searchParams.get("farm") ?? "";
  const lang = url.searchParams.get("lang");
  const locale = isLocale(lang) ? lang : "en";
  if (!/^[0-9a-f-]{36}$/i.test(farmId)) return json({ error: "Unknown farm." }, 400);

  const db = createClient(SUPABASE_URL, SUPABASE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: auth, error: authError } = await db.auth.getUser(token);
  if (authError || !auth.user) return json({ error: "Sign in again." }, 401);

  const { data: member } = await db
    .from("farm_members")
    .select("role, farm:farms!inner(id, currency, has_dairy, has_layer, has_goat, has_fattening, has_broiler, plan, plan_expires_at, suspended)")
    .eq("user_id", auth.user.id)
    .eq("farm_id", farmId)
    .maybeSingle();
  const farm = (member as unknown as { role: Role; farm: Parameters<typeof loadMyReminders>[1] & { suspended: boolean } } | null) ?? null;
  if (!farm || farm.farm.suspended) return json({ error: "Not a member of this farm." }, 403);

  const [{ open, done }, optionRows] = await Promise.all([
    loadMyReminders(db, farm.farm, farm.role, auth.user.id),
    getCachedOptionRows().catch(() => []),
  ]);
  const i18n = createI18n(locale, messagesFor(locale), optionRows);
  return json({
    open: open.map((r) => ({ key: r.key, kind: r.kind, tone: r.tone, days: r.days, href: r.href, ...reminderText(r, i18n) })),
    done: done.length,
  });
}
