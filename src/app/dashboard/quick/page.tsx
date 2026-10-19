import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { QuickEntry, type QuickData } from "@/components/offline/quick-entry";
import { MANAGERS, requireRole, STAFF } from "@/lib/auth";
import { milkingCategories } from "@/lib/cattle";
import { today } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("offline.title") };
}

/**
 * Quick daily entry that keeps working without internet: the service worker
 * keeps a copy of this page, and entries made offline are sent later.
 * Forms start empty (a cached copy may be days old, so it must not show stale values).
 */
export default async function QuickEntryPage() {
  const { supabase, farm, user, role } = await requireRole(STAFF);
  const { t, rows } = await getI18n();
  const isManager = MANAGERS.includes(role);

  const [cows, flocks, logs, stock, staff] = await Promise.all([
    farm.has_dairy
      ? supabase
          .from("cattle")
          .select("id, tag_number, name")
          .eq("farm_id", farm.id)
          .eq("status", "active")
          .in("category", milkingCategories(rows))
          .is("deleted_at", null)
          .order("tag_number")
      : Promise.resolve({ data: [] }),
    farm.has_layer
      ? supabase.from("flocks").select("id, name").eq("farm_id", farm.id).eq("status", "active").is("deleted_at", null).order("name")
      : Promise.resolve({ data: [] }),
    // Recent logs, to default each flock to the feed it used last.
    farm.has_layer
      ? supabase
          .from("flock_daily_logs")
          .select("flock_id, feed_item_id, log_date")
          .eq("farm_id", farm.id)
          .not("feed_item_id", "is", null)
          .order("log_date", { ascending: false })
          .limit(200)
      : Promise.resolve({ data: [] }),
    supabase.from("inventory_stock").select("id, name, kind, unit, unit_kg, module").eq("farm_id", farm.id).eq("archived", false).order("name"),
    isManager
      ? supabase.from("staff").select("id, name").eq("farm_id", farm.id).eq("active", true).order("name")
      : Promise.resolve({ data: [] }),
  ]);

  const lastFeed: Record<string, string> = {};
  for (const l of (logs.data ?? []) as { flock_id: string; feed_item_id: string | null }[]) {
    if (l.feed_item_id && !lastFeed[l.flock_id]) lastFeed[l.flock_id] = l.feed_item_id;
  }
  type StockRow = { id: string; name: string; kind: string; unit: string; unit_kg: number | null; module: string };
  const items = (stock.data ?? []) as StockRow[];

  const data: QuickData = {
    farmId: farm.id,
    farmName: farm.name,
    userId: user.id,
    serverToday: today(),
    hasDairy: farm.has_dairy,
    hasLayer: farm.has_layer,
    isManager,
    cows: (cows.data ?? []) as QuickData["cows"],
    flocks: ((flocks.data ?? []) as { id: string; name: string }[]).map((x) => ({ ...x, lastFeed: lastFeed[x.id] ?? "" })),
    // Feed for flock logs must be measurable in kg.
    layerFeeds: items
      .filter((x) => ["feed", "supplement"].includes(x.kind) && ["layer", "general"].includes(x.module) && (x.unit === "kg" || (x.unit_kg ?? 0) > 0))
      .map((x) => ({ id: x.id, name: x.name })),
    items: items.map((x) => ({ id: x.id, name: x.name, unit: x.unit, module: x.module })),
    staff: (staff.data ?? []) as QuickData["staff"],
  };

  return (
    <>
      <PageHeader title={t("offline.title")} description={t("offline.desc")} />
      <QuickEntry data={data} />
    </>
  );
}
