import { NextResponse, type NextRequest } from "next/server";
import { localePath } from "@/lib/i18n/paths";
import { validPromoUrl } from "@/lib/promos";
import { createPublicClient } from "@/lib/supabase/public";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * A click on a promo box: counted (one number per box per day, nothing about
 * the visitor), then the visitor is sent to the box's link. Site pages open in
 * the visitor's language (?l=bn).
 */
export async function GET(request: NextRequest, { params }: RouteContext<"/api/promo/[id]">) {
  const { id } = await params;
  const bn = request.nextUrl.searchParams.get("l") === "bn";
  let target = bn ? "/bn" : "/";
  if (UUID.test(id)) {
    const { data } = await createPublicClient().rpc("record_promo_click", { p_id: id });
    if (typeof data === "string" && validPromoUrl(data)) target = data.startsWith("/") ? localePath(data, bn ? "bn" : "en") : data;
  }
  const res = NextResponse.redirect(new URL(target, request.url), 302);
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}
