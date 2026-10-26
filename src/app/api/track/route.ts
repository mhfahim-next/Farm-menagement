import { NextResponse, type NextRequest } from "next/server";
import { deviceOf, readGeo, recordPresence } from "@/lib/geo";
import { createClient } from "@/lib/supabase/server";

const SEEN_COOKIE = "ff_seen";

/** Page-view beacon from <Analytics />. Also refreshes a signed-in user's last-seen location (at most hourly). */
export async function POST(request: NextRequest) {
  let body: { path?: unknown; referrer?: unknown; visitor?: unknown; locale?: unknown; utm_source?: unknown; utm_medium?: unknown; utm_campaign?: unknown };
  try {
    body = await request.json();
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const path = typeof body.path === "string" ? body.path.slice(0, 300) : "";
  if (!path.startsWith("/")) return new NextResponse(null, { status: 400 });

  // Keep only the referring site's host, and drop our own.
  let referrer: string | null = null;
  if (typeof body.referrer === "string" && body.referrer) {
    try {
      const host = new URL(body.referrer).host;
      if (host && host !== request.nextUrl.host) referrer = host;
    } catch {
      /* not a URL */
    }
  }

  const supabase = await createClient();
  const geo = await readGeo();
  await supabase.rpc("track_page_view", {
    p_path: path,
    p_referrer: referrer,
    p_visitor: typeof body.visitor === "string" ? body.visitor.slice(0, 64) : null,
    p_country: geo.country,
    p_device: deviceOf(geo.userAgent),
    p_locale: typeof body.locale === "string" ? body.locale.slice(0, 5) : null,
    p_utm_source: typeof body.utm_source === "string" ? body.utm_source.slice(0, 60) : null,
    p_utm_medium: typeof body.utm_medium === "string" ? body.utm_medium.slice(0, 60) : null,
    p_utm_campaign: typeof body.utm_campaign === "string" ? body.utm_campaign.slice(0, 80) : null,
  });

  const res = new NextResponse(null, { status: 204 });
  if (!request.cookies.get(SEEN_COOKIE)) {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      await recordPresence(supabase, "seen");
      res.cookies.set(SEEN_COOKIE, "1", { maxAge: 3600, httpOnly: true, sameSite: "lax", path: "/" });
    }
  }
  return res;
}
