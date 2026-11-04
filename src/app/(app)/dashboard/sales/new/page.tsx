import type { Metadata } from "next";
import { SaleForm } from "@/components/sale-form";
import { ButtonLink, Card, PageHeader } from "@/components/ui";
import { requireRole, STAFF } from "@/lib/auth";
import { today } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { keepsAnimals } from "@/lib/modules";
import type { Product } from "@/lib/trade";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("sales.newSale") };
}

export default async function NewSalePage({ searchParams }: PageProps<"/dashboard/sales/new">) {
  const { supabase, farm } = await requireRole(STAFF);
  const { t } = await getI18n();
  const { buyer, product: wanted, flock } = await searchParams;
  const [{ data: buyers }, { data: cattle }, { data: flocks }, { data: meat }] = await Promise.all([
    supabase.from("buyer_balances").select("id, name, milk_rate, egg_rate, due").eq("farm_id", farm.id).eq("archived", false).order("name"),
    keepsAnimals(farm)
      ? supabase.from("cattle").select("id, tag_number, name").eq("farm_id", farm.id).eq("status", "active").is("deleted_at", null).order("tag_number")
      : Promise.resolve({ data: [] }),
    farm.has_layer
      ? supabase.from("flocks").select("id, name").eq("farm_id", farm.id).eq("kind", "layer").eq("status", "active").is("deleted_at", null).order("name")
      : Promise.resolve({ data: [] }),
    farm.has_broiler
      ? supabase.from("flocks").select("id, name").eq("farm_id", farm.id).neq("kind", "layer").eq("status", "active").is("deleted_at", null).order("placed_date", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);
  const meatRows = (meat ?? []) as { id: string; name: string }[];
  const { data: meatStats } = meatRows.length
    ? await supabase.from("flock_stats").select("flock_id, current_count").in("flock_id", meatRows.map((x) => x.id))
    : { data: [] };
  const liveOf = new Map((meatStats ?? []).map((x) => [x.flock_id as string, Number(x.current_count)]));
  const meatFlocks = meatRows.map((x) => ({ id: x.id, name: x.name, live: liveOf.get(x.id) ?? 0 })).filter((x) => x.live > 0);
  // Only what this farm produces.
  const products: Product[] = [
    ...(farm.has_dairy ? (["milk"] as const) : []),
    ...(farm.has_layer ? (["eggs"] as const) : []),
    ...(farm.has_broiler ? (["birds"] as const) : []),
    "animal",
    "manure",
    "other",
  ];

  return (
    <>
      <PageHeader
        title={t("sales.newSale")}
        description={t("sales.newSaleDesc")}
        action={<ButtonLink href="/dashboard/sales" variant="secondary">{t("common.back")}</ButtonLink>}
      />
      <Card className="max-w-xl">
        <SaleForm
          buyers={(buyers ?? []).map((b) => ({
            id: b.id as string,
            name: b.name as string,
            milk_rate: b.milk_rate === null ? null : Number(b.milk_rate),
            egg_rate: b.egg_rate === null ? null : Number(b.egg_rate),
            due: Number(b.due),
          }))}
          cattle={(cattle ?? []).map((c) => ({ id: c.id as string, label: c.name ? `${c.tag_number} · ${c.name}` : (c.tag_number as string) }))}
          flocks={(flocks ?? []) as { id: string; name: string }[]}
          currency={farm.currency}
          today={today()}
          presetBuyer={typeof buyer === "string" ? buyer : undefined}
          products={products}
          meatFlocks={meatFlocks}
          presetProduct={typeof wanted === "string" ? (wanted as Product) : undefined}
          presetFlock={typeof flock === "string" ? flock : undefined}
        />
      </Card>
    </>
  );
}
