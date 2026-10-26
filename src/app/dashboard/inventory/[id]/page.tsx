import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { ConfirmForm } from "@/components/confirm-form";
import { StockItemFields } from "@/components/stock-item-fields";
import { Badge, ButtonLink, Card, EmptyState, PageHeader, StatCard, Table, Td } from "@/components/ui";
import { MANAGERS, requireRole, STAFF } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { daysLeft, isLow, type StockItem, type StockMove } from "@/lib/trade";
import { deleteMove, updateItem } from "../actions";
import { moduleAllowed } from "@/lib/modules";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("stock.title") };
}

export default async function StockItemPage({ params }: PageProps<"/dashboard/inventory/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase, farm, role } = await requireRole(STAFF);
  const i18n = await getI18n();
  const { t, f, o, options } = i18n;

  const [{ data: itemRow }, { data: moveRows }, { data: flockRows }] = await Promise.all([
    supabase.from("inventory_stock").select("*").eq("id", id).eq("farm_id", farm.id).maybeSingle(),
    supabase.from("inventory_moves").select("*").eq("item_id", id).eq("farm_id", farm.id).order("move_date", { ascending: false }).order("created_at", { ascending: false }).limit(300),
    supabase.from("flocks").select("id, name").eq("farm_id", farm.id),
  ]);
  const item = itemRow as StockItem | null;
  if (!item) notFound();
  const moves = (moveRows ?? []) as StockMove[];
  const flockName = new Map((flockRows ?? []).map((x) => [x.id as string, x.name as string]));
  const canDelete = MANAGERS.includes(role);
  const money = (n: number) => f.money(n, farm.currency);
  const unit = t(`stock.unit.${item.unit}`);
  const qty = (n: number) => `${f.number(n, 3)} ${unit}`;
  const days = daysLeft(item);
  const modules = options("txn_module").filter(
    (m) => moduleAllowed(farm, m.value),
  );

  return (
    <>
      <PageHeader
        title={item.name}
        description={`${t(`stock.kind.${item.kind}`)} · ${o("txn_module", item.module)}`}
        action={
          <span className="flex flex-wrap gap-2">
            <ButtonLink href={`/dashboard/inventory/move?type=purchase&item=${item.id}`}>+ {t("stock.buy")}</ButtonLink>
            <ButtonLink href={`/dashboard/inventory/move?type=use&item=${item.id}`} variant="secondary">− {t("stock.use")}</ButtonLink>
            <ButtonLink href={`/dashboard/inventory/move?type=adjust&item=${item.id}`} variant="secondary">{t("stock.moveTab.adjust")}</ButtonLink>
            <ButtonLink href="/dashboard/inventory" variant="secondary">{t("common.back")}</ButtonLink>
          </span>
        }
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label={t("stock.colOnHand")} value={qty(Number(item.on_hand))} tone={isLow(item) || Number(item.on_hand) < 0 ? "bad" : "default"} />
        <StatCard label={t("stock.colAvgCost")} value={item.avg_cost !== null ? `${money(Number(item.avg_cost))} / ${unit}` : "—"} />
        <StatCard label={t("stock.used30")} value={qty(Number(item.used_30d))} />
        <StatCard label={t("stock.colDaysLeft")} value={days === null ? "—" : t("stock.days", { n: f.number(days) })} />
      </div>
      {isLow(item) && (
        <p role="status" className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">⚠ {t("stock.lowOne", { n: qty(Number(item.low_stock)) })}</p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card title={t("stock.history")}>
          {moves.length === 0 ? (
            <EmptyState title={t("stock.noMoves")} />
          ) : (
            <Table head={[t("common.date"), t("stock.colType"), t("stock.colQty"), t("stock.colCost"), t("common.notes"), ""]}>
              {moves.map((m) => (
                <tr key={m.id}>
                  <Td>{f.date(m.move_date)}</Td>
                  <Td>
                    <Badge tone={m.move_type === "purchase" ? "green" : m.move_type === "use" ? "blue" : "amber"}>{t(`stock.moveTab.${m.move_type}`)}</Badge>
                  </Td>
                  <Td className="tabular-nums">
                    {m.move_type === "use" ? "−" : Number(m.quantity) > 0 ? "+" : "−"}
                    {qty(Math.abs(Number(m.quantity)))}
                  </Td>
                  <Td className="tabular-nums">
                    {m.total_cost !== null ? money(Number(m.total_cost)) : "—"}
                    {m.unit_cost !== null && <span className="block text-xs text-stone-500">{money(Number(m.unit_cost))} / {unit}</span>}
                  </Td>
                  <Td>
                    {m.supplier && <span className="block">{m.supplier}</span>}
                    {m.flock_id && <span className="block text-xs text-stone-500">{flockName.get(m.flock_id)}</span>}
                    {m.log_id && m.flock_id && (
                      <Link href={`/dashboard/flocks/${m.flock_id}/log?date=${m.move_date}`} className="block text-xs text-emerald-700 hover:underline">{t("stock.fromLog")}</Link>
                    )}
                    {m.module && !m.flock_id && <span className="block text-xs text-stone-500">{o("txn_module", m.module)}</span>}
                    {m.notes}
                  </Td>
                  <Td>
                    {canDelete && !m.log_id && (
                      <ConfirmForm action={deleteMove} fields={{ id: m.id }} confirm={t("stock.confirmDeleteMove")} label={t("common.delete")} variant="ghost" />
                    )}
                  </Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card title={t("stock.editItem")}>
          <ActionForm action={updateItem} submitLabel={t("common.save")}>
            <input type="hidden" name="id" value={item.id} />
            <StockItemFields i18n={i18n} item={item} modules={modules} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="archived" defaultChecked={item.archived} className="accent-emerald-700" />
              {t("stock.archive")}
            </label>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
