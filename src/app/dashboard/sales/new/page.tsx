import type { Metadata } from "next";
import { SaleForm } from "@/components/sale-form";
import { ButtonLink, Card, PageHeader } from "@/components/ui";
import { requireRole, STAFF } from "@/lib/auth";
import { today } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import type { Product } from "@/lib/trade";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("sales.newSale") };
}

export default async function NewSalePage({ searchParams }: PageProps<"/dashboard/sales/new">) {
  const { supabase, farm } = await requireRole(STAFF);
  const { t } = await getI18n();
  const { buyer } = await searchParams;
  const [{ data: buyers }, { data: cattle }, { data: flocks }] = await Promise.all([
    supabase.from("buyer_balances").select("id, name, milk_rate, egg_rate, due").eq("farm_id", farm.id).eq("archived", false).order("name"),
    farm.has_dairy
      ? supabase.from("cattle").select("id, tag_number, name").eq("farm_id", farm.id).eq("status", "active").is("deleted_at", null).order("tag_number")
      : Promise.resolve({ data: [] }),
    farm.has_layer
      ? supabase.from("flocks").select("id, name").eq("farm_id", farm.id).eq("status", "active").is("deleted_at", null).order("name")
      : Promise.resolve({ data: [] }),
  ]);
  // Only what this farm produces.
  const products: Product[] = [
    ...(farm.has_dairy ? (["milk"] as const) : []),
    ...(farm.has_layer ? (["eggs"] as const) : []),
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
        />
      </Card>
    </>
  );
}
