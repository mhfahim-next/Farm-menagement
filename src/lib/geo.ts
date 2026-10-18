import "server-only";
import { headers } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

export type Geo = {
  ip: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  lat: number | null;
  lon: number | null;
  userAgent: string | null;
};

const dec = (v: string | null) => {
  if (!v) return null;
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
};
const num = (v: string | null) => {
  const n = v === null || v === "" ? NaN : Number(v);
  return Number.isFinite(n) ? n : null;
};

/**
 * Visitor IP and approximate location from the hosting edge's headers:
 * Vercel (x-vercel-ip-*) or Cloudflare (cf-ip*, with "visitor location
 * headers" turned on). Running locally there are none, so all are null.
 */
export async function readGeo(): Promise<Geo> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? h.get("cf-connecting-ip"))?.trim() || null;
  const country = h.get("x-vercel-ip-country") ?? h.get("cf-ipcountry");
  return {
    ip,
    country: country && country !== "XX" ? country.toUpperCase() : null,
    region: dec(h.get("x-vercel-ip-country-region") ?? h.get("cf-region")),
    city: dec(h.get("x-vercel-ip-city") ?? h.get("cf-ipcity")),
    lat: num(h.get("x-vercel-ip-latitude") ?? h.get("cf-iplatitude")),
    lon: num(h.get("x-vercel-ip-longitude") ?? h.get("cf-iplongitude")),
    userAgent: h.get("user-agent"),
  };
}

export function deviceOf(userAgent: string | null): "mobile" | "tablet" | "desktop" {
  const ua = userAgent ?? "";
  if (/iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(ua)) return "tablet";
  if (/Mobi|iPhone|iPod|Android|Opera Mini|IEMobile/i.test(ua)) return "mobile";
  return "desktop";
}

/** Saves the signed-in user's IP and approximate location (and a login/sign-up event). Never throws. */
export async function recordPresence(supabase: SupabaseClient, kind: "login" | "signup" | "seen") {
  try {
    const g = await readGeo();
    const { error } = await supabase.rpc("record_presence", {
      p_kind: kind,
      p_ip: g.ip,
      p_country: g.country,
      p_region: g.region,
      p_city: g.city,
      p_lat: g.lat,
      p_lon: g.lon,
      p_user_agent: g.userAgent,
    });
    if (error) console.error("record_presence:", error.message);
  } catch (e) {
    console.error("record_presence:", e);
  }
}
