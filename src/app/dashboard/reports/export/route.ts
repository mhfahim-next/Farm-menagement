import { NextResponse, type NextRequest } from "next/server";
import { requireFarm, STAFF } from "@/lib/auth";
import { toCsv, type Cell } from "@/lib/csv";
import { today } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { getPlanContext } from "@/lib/plans";

const KINDS = ["cattle", "milk", "health", "breeding", "flocks", "finance"] as const;
type Kind = (typeof KINDS)[number];
const PAGE = 1000; // the API returns at most 1000 rows per request

type Row = Record<string, unknown>;

/** Reads every row of a query by paging through it. */
async function fetchAll(page: (from: number, to: number) => PromiseLike<{ data: Row[] | null; error: { message: string } | null }>) {
  const out: Row[] = [];
  for (let from = 0; from < 100_000; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return out;
}

export async function GET(request: NextRequest) {
  const { supabase, farm, role } = await requireFarm();
  if (!STAFF.includes(role)) return new NextResponse("Forbidden", { status: 403 });

  // The plan check is here, not just in the UI: Free farms can't export.
  const { plan } = await getPlanContext();
  const { t, o, e } = await getI18n();
  if (!plan?.can_export) return new NextResponse(t("reports.err.locked"), { status: 403 });

  const params = request.nextUrl.searchParams;
  const kind = params.get("kind") as Kind;
  if (!KINDS.includes(kind)) return new NextResponse("Unknown report", { status: 400 });
  const date = (v: string | null, fallback: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : fallback);
  const from = date(params.get("from"), today(-29));
  const to = date(params.get("to"), today());

  const base = (table: string) => supabase.from(table).select("*").eq("farm_id", farm.id);
  const range = (col: string) => (q: ReturnType<typeof base>) => q.gte(col, from).lte(col, to).order(col);

  // Animal and flock lookups for readable names.
  const { data: animals } = await supabase.from("cattle").select("id, tag_number, name").eq("farm_id", farm.id);
  const tagOf = new Map((animals ?? []).map((a) => [a.id, `${a.tag_number}${a.name ? ` · ${a.name}` : ""}`]));
  const col = (key: Parameters<typeof t>[0]) => t(key);

  let header: string[] = [];
  let rows: Cell[][] = [];

  if (kind === "cattle") {
    const data = await fetchAll((a, b) => base("cattle").is("deleted_at", null).order("tag_number").range(a, b));
    header = (["tag", "name", "type", "sex", "breed", "status", "dob", "mother", "father", "purchaseDate", "purchasePrice", "notes"] as const).map((k) => col(`reports.col.${k}`));
    rows = data.map((c) => [
      c.tag_number as string, c.name as string, o("cattle_category", c.category as string), e(c.sex as string),
      c.breed ? o("cattle_breed", c.breed as string) : "", o("cattle_status", c.status as string),
      c.date_of_birth as string, c.mother_id ? tagOf.get(c.mother_id as string) : "", c.father as string,
      c.purchase_date as string, c.purchase_price as number, c.notes as string,
    ]);
  } else if (kind === "milk") {
    const data = await fetchAll((a, b) => range("record_date")(base("milk_records")).range(a, b));
    header = (["date", "animal", "session", "litres", "fat", "notes"] as const).map((k) => col(`reports.col.${k}`));
    rows = data.map((r) => [r.record_date as string, tagOf.get(r.cattle_id as string), o("milk_session", r.session as string), r.quantity_liters as number, r.fat_percent as number, r.notes as string]);
  } else if (kind === "health") {
    const data = await fetchAll((a, b) => range("record_date")(base("health_records")).range(a, b));
    header = (["date", "animal", "type", "product", "dose", "batch", "givenBy", "cost", "nextDue", "withdrawal", "notes"] as const).map((k) => col(`reports.col.${k}`));
    rows = data.map((r) => [r.record_date as string, tagOf.get(r.cattle_id as string), o("health_type", r.record_type as string), (r.product ?? r.description) as string, r.dose as string, r.batch_number as string, r.vet_name as string, r.cost as number, r.next_due_date as string, r.withdrawal_until as string, r.description as string]);
  } else if (kind === "breeding") {
    const data = await fetchAll((a, b) => range("event_date")(base("breeding_events")).range(a, b));
    header = (["date", "time", "animal", "event", "bullSemen", "technician", "result", "expectedCalving", "signs", "cost", "notes"] as const).map((k) => col(`reports.col.${k}`));
    rows = data.map((r) => [r.event_date as string, r.event_time ? String(r.event_time).slice(0, 5) : "", tagOf.get(r.cattle_id as string), o("breeding_event", r.event_type as string), r.bull_or_semen as string, r.technician as string, r.result ? o("pregnancy_result", r.result as string) : "", r.expected_calving_date as string, r.heat_signs ? String(r.heat_signs).split(",").map((s) => o("heat_sign", s.trim())).join("; ") : "", r.cost as number, r.notes as string]);
  } else if (kind === "flocks") {
    const { data: fl } = await supabase.from("flocks").select("id, name").eq("farm_id", farm.id);
    const flockName = new Map((fl ?? []).map((x) => [x.id, x.name]));
    const data = await fetchAll((a, b) => range("log_date")(base("flock_daily_logs")).range(a, b));
    header = (["date", "flock", "eggs", "broken", "deaths", "culled", "feedKg", "waterL", "notes"] as const).map((k) => col(`reports.col.${k}`));
    rows = data.map((r) => [r.log_date as string, flockName.get(r.flock_id as string), r.eggs_collected as number, r.eggs_broken as number, r.mortality as number, r.culled as number, r.feed_kg as number, r.water_liters as number, r.notes as string]);
  } else {
    const data = await fetchAll((a, b) => range("txn_date")(base("finance_ledger")).range(a, b));
    header = (["date", "type", "module", "category", "amount", "description", "source"] as const).map((k) => col(`reports.col.${k}`));
    rows = data.map((r) => [r.txn_date as string, o("txn_type", r.txn_type as string), o("txn_module", r.module as string), o("finance_category", r.category as string), r.amount as number, r.description as string, t(`finance.source.${r.source as "manual" | "health" | "breeding" | "flock_health" | "salary"}`)]);
  }

  const safeFarm = farm.name.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "farm";
  return new NextResponse(toCsv(header, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="farmflow-${safeFarm}-${kind}-${today()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
