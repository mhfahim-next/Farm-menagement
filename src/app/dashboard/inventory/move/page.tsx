import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { AmountCalculator } from "@/components/amount-calculator";
import { ButtonLink, Card, EmptyState, Field, Input, PageHeader, Select } from "@/components/ui";
import { requireRole, STAFF } from "@/lib/auth";
import { today } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { MOVE_TYPES, type MoveType, type StockItem } from "@/lib/trade";
import { addMove } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("stock.title") };
}

export default async function StockMovePage({ searchParams }: PageProps<"/dashboard/inventory/move">) {
  const { supabase, farm } = await requireRole(STAFF);
  const { t, f, options } = await getI18n();
  const sp = await searchParams;
  const type: MoveType = MOVE_TYPES.find((x) => x === sp.type) ?? "purchase";
  const preset = typeof sp.item === "string" ? sp.item : "";

  const [{ data }, { data: flockRows }] = await Promise.all([
    supabase.from("inventory_stock").select("*").eq("farm_id", farm.id).eq("archived", false).order("name"),
    farm.has_layer
      ? supabase.from("flocks").select("id, name").eq("farm_id", farm.id).eq("status", "active").is("deleted_at", null).order("name")
      : Promise.resolve({ data: [] }),
  ]);
  const items = (data ?? []) as StockItem[];
  const flocks = (flockRows ?? []) as { id: string; name: string }[];
  const modules = options("txn_module").filter(
    (m) => (m.value !== "dairy" || farm.has_dairy) && (m.value !== "layer" || farm.has_layer),
  );
  const selected = items.find((i) => i.id === preset);
  const unitOf = (i: StockItem) => t(`stock.unit.${i.unit}`);

  return (
    <>
      <PageHeader
        title={t(`stock.moveTitle.${type}`)}
        description={t(`stock.moveDesc.${type}`)}
        action={<ButtonLink href={selected ? `/dashboard/inventory/${selected.id}` : "/dashboard/inventory"} variant="secondary">{t("common.back")}</ButtonLink>}
      />
      <nav aria-label={t("stock.title")} className="mb-4 inline-flex rounded-lg border border-stone-300 p-0.5 text-sm">
        {MOVE_TYPES.map((x) => (
          <Link
            key={x}
            href={`/dashboard/inventory/move?type=${x}${preset ? `&item=${preset}` : ""}`}
            aria-current={x === type ? "page" : undefined}
            className={`rounded-md px-3 py-1.5 font-medium ${x === type ? "bg-emerald-700 text-white" : "text-stone-600 hover:bg-stone-100"}`}
          >
            {t(`stock.moveTab.${x}`)}
          </Link>
        ))}
      </nav>

      <Card className="max-w-xl">
        {items.length === 0 ? (
          <EmptyState title={t("stock.empty")}>
            <ButtonLink href="/dashboard/inventory/new" className="mt-3">{t("stock.newItem")}</ButtonLink>
          </EmptyState>
        ) : (
          <ActionForm action={addMove} submitLabel={t("common.save")} successHref="/dashboard/inventory" key={type}>
            <input type="hidden" name="move_type" value={type} />
            <Field label={t("stock.colItem")}>
              <Select
                name="item_id"
                defaultValue={preset}
                required
                options={[
                  { value: "", label: t("stock.pickItem") },
                  ...items.map((i) => ({ value: i.id, label: `${i.name} · ${f.number(Number(i.on_hand), 2)} ${unitOf(i)}` })),
                ]}
              />
            </Field>
            <Field label={t("common.date")}>
              <Input name="move_date" type="date" defaultValue={today()} max={today()} required />
            </Field>

            {type === "purchase" && (
              <>
                <AmountCalculator currency={farm.currency} />
                <Field label={t("stock.supplier")}>
                  <Input name="supplier" maxLength={80} />
                </Field>
              </>
            )}
            {type === "use" && (
              <>
                <Field label={t("stock.useQty")} hint={selected ? t("stock.inStock", { n: `${f.number(Number(selected.on_hand), 2)} ${unitOf(selected)}` }) : undefined}>
                  <Input name="quantity" type="number" min="0.001" step="0.001" inputMode="decimal" required />
                </Field>
                <Field label={t("stock.usedFor")}>
                  <Select name="module" defaultValue={selected?.module ?? "general"} options={modules} />
                </Field>
                {flocks.length > 0 && (
                  <Field label={t("stock.flockOptional")}>
                    <Select name="flock_id" options={[{ value: "", label: "—" }, ...flocks.map((x) => ({ value: x.id, label: x.name }))]} />
                  </Field>
                )}
              </>
            )}
            {type === "adjust" && (
              <Field label={t("stock.counted")} hint={t("stock.countedHint")}>
                <Input name="counted" type="number" min="0" step="0.001" inputMode="decimal" required />
              </Field>
            )}
            <Field label={t("common.notes")}>
              <Input name="notes" maxLength={500} />
            </Field>
            {type === "purchase" && <p className="text-xs text-stone-500">{t("stock.financeNote")}</p>}
          </ActionForm>
        )}
      </Card>
    </>
  );
}
