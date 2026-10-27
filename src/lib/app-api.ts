import "server-only";
import { NextResponse } from "next/server";
import { runAsApp } from "@/lib/app-request";
import { getUser, requireFarm, type FarmContext } from "@/lib/auth";
import { isLocale } from "@/lib/i18n/core";

// Shared plumbing for the Android app's API routes (/api/app/*): the app sends
// "Authorization: Bearer <Supabase access token>", the farm it shows and its
// language. Everything runs with that person's own rights; never a service key.

export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

export const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { ...CORS, "Cache-Control": "no-store" } });

export const preflight = () => new Response(null, { status: 204, headers: CORS });

const UUID = /^[0-9a-f-]{36}$/i;

/** notFound() / redirect() thrown by the website's guards: the person may not do this. */
function isGuardError(e: unknown) {
  const digest = (e as { digest?: unknown } | null)?.digest;
  return typeof digest === "string" && (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_HTTP_ERROR_FALLBACK"));
}

/**
 * Runs `fn` as the app's user on the farm they picked. Answers 401 without a
 * valid session and 403 when they are not a member of that farm (requireFarm
 * would otherwise fall back to another of their farms).
 */
export async function withAppFarm(request: Request, farm: unknown, lang: unknown, fn: (ctx: FarmContext) => Promise<Response>) {
  const token = /^Bearer (.+)$/.exec(request.headers.get("authorization") ?? "")?.[1];
  if (!token) return json({ error: "Sign in first." }, 401);
  if (typeof farm !== "string" || !UUID.test(farm)) return json({ error: "Unknown farm." }, 400);
  const locale = isLocale(lang) ? lang : "en";
  try {
    return await runAsApp({ token, farmId: farm, locale }, async () => {
      if (!(await getUser())) return json({ error: "Sign in again." }, 401);
      const ctx = await requireFarm();
      if (ctx.farm.id !== farm) return json({ error: "Not a member of this farm." }, 403);
      return fn(ctx);
    });
  } catch (e) {
    if (isGuardError(e)) return json({ error: "Not allowed." }, 403);
    throw e;
  }
}

/** The JSON body of a POST, or null when it isn't an object. */
export async function bodyOf(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const b = await request.json();
    return b && typeof b === "object" && !Array.isArray(b) ? (b as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Form data from [[name, value], …] pairs (strings only, bounded). */
export function formOf(pairs: unknown, extra: Record<string, string> = {}) {
  const fd = new FormData();
  if (Array.isArray(pairs)) {
    for (const p of pairs.slice(0, 120)) {
      if (Array.isArray(p) && typeof p[0] === "string" && typeof p[1] === "string" && p[1].length <= 2000) fd.append(p[0], p[1]);
    }
  }
  for (const [k, v] of Object.entries(extra)) fd.set(k, v);
  return fd;
}
