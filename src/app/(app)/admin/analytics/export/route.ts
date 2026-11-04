import { NextResponse, type NextRequest } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { toCsv, type Cell } from "@/lib/csv";

/** CSV downloads for the admin analytics page (super admins only): daily numbers, sources, quiet farms. */
export async function GET(request: NextRequest) {
  const { supabase } = await requireSuperAdmin();
  const kind = request.nextUrl.searchParams.get("kind");
  const raw = Number(request.nextUrl.searchParams.get("days"));
  const days = [7, 30, 90].includes(raw) ? raw : 30;

  let header: string[] = [];
  let rows: Cell[][] = [];
  if (kind === "daily") {
    const { data, error } = await supabase.rpc("admin_analytics", { p_days: days });
    if (error) return new NextResponse(error.message, { status: 500 });
    const d = (data as { daily: { day: string; views: number; visitors: number; signups: number }[] }).daily;
    header = ["date", "page_views", "visitors", "signups"];
    rows = d.map((x) => [x.day, x.views, x.visitors, x.signups]);
  } else if (kind === "sources") {
    const { data, error } = await supabase.rpc("admin_analytics_sources", { p_days: days });
    if (error) return new NextResponse(error.message, { status: 500 });
    const d = data as { sources: { source: string; visitors: number; signups: number }[]; campaigns: { campaign: string; visitors: number; signups: number }[] };
    header = ["type", "name", "visitors", "signups"];
    rows = [...d.sources.map((x) => ["source", x.source, x.visitors, x.signups]), ...d.campaigns.map((x) => ["campaign", x.campaign, x.visitors, x.signups])];
  } else if (kind === "inactive") {
    const { data, error } = await supabase.rpc("admin_analytics_growth", { p_days: days });
    if (error) return new NextResponse(error.message, { status: 500 });
    const d = (data as { inactive_farms: { name: string; plan: string; created_at: string; email: string | null; owner: string | null; phone: string | null; last_activity: string | null }[] }).inactive_farms;
    header = ["farm", "owner", "email", "phone", "plan", "opened", "last_record"];
    rows = d.map((x) => [x.name, x.owner, x.email, x.phone, x.plan, x.created_at?.slice(0, 10), x.last_activity?.slice(0, 10) ?? ""]);
  } else {
    return new NextResponse("Unknown report", { status: 400 });
  }

  return new NextResponse(toCsv(header, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="farmflows-analytics-${kind}-${days}d.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
