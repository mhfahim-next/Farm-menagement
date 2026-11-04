"use server";

import { revalidatePath } from "next/cache";
import { MANAGERS, requireRole, STAFF } from "@/lib/auth";
import { dbError, wrongFarm, num, str } from "@/lib/form";
import { getI18n } from "@/lib/i18n/server";
import { ITEM_KINDS, ITEM_UNITS, MOVE_TYPES, type ItemKind, type ItemUnit, type MoveType } from "@/lib/trade";
import type { ActionState } from "@/lib/types";

const UUID = /^[0-9a-f-]{36}$/i;
const MODULES = ["dairy", "layer", "general"] as const;

function itemFields(formData: FormData) {
  const kind = str(formData, "kind");
  const unit = str(formData, "unit");
  const section = str(formData, "module");
  return {
    name: str(formData, "name"),
    kind: (ITEM_KINDS as readonly string[]).includes(kind ?? "") ? (kind as ItemKind) : "feed",
    unit: (ITEM_UNITS as readonly string[]).includes(unit ?? "") ? (unit as ItemUnit) : "kg",
    unit_kg: num(formData, "unit_kg"),
    module: (MODULES as readonly string[]).includes(section ?? "") ? (section as (typeof MODULES)[number]) : "general",
    low_stock: num(formData, "low_stock"),
    notes: str(formData, "notes"),
  };
}

function refresh() {
  revalidatePath("/dashboard", "layout");
}

export async function createItem(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireRole(STAFF);
  const { t } = await getI18n();
  const v = itemFields(formData);
  if (!v.name) return { error: t("stock.errName") };
  const { error } = await supabase.from("inventory_items").insert({ farm_id: farm.id, ...v });
  if (error) return { error: error.code === "23505" ? t("stock.errNameTaken") : dbError(t, error) };
  refresh();
  return { success: t("stock.itemSaved") };
}

export async function updateItem(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireRole(STAFF);
  const { t } = await getI18n();
  const id = str(formData, "id");
  if (!id || !UUID.test(id)) return { error: t("common.errorGeneric") };
  const v = itemFields(formData);
  if (!v.name) return { error: t("stock.errName") };
  const { error } = await supabase
    .from("inventory_items")
    .update({ ...v, archived: formData.get("archived") === "on" })
    .eq("id", id)
    .eq("farm_id", farm.id);
  if (error) return { error: error.code === "23505" ? t("stock.errNameTaken") : dbError(t, error) };
  refresh();
  return { success: t("stock.itemSaved") };
}

export async function addMove(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireRole(STAFF);
  const { t } = await getI18n();
  if (wrongFarm(formData, farm.id)) return { error: t("offline.wrongFarm") };
  const itemId = str(formData, "item_id");
  const type = str(formData, "move_type") as MoveType | null;
  if (!itemId || !UUID.test(itemId) || !type || !(MOVE_TYPES as readonly string[]).includes(type)) {
    return { error: t("stock.errPickItem") };
  }
  let quantity = num(formData, "quantity");
  if (type === "adjust") {
    // A stock count: the difference between what was counted and what the app shows.
    const counted = num(formData, "counted");
    const { data: item } = await supabase.from("inventory_stock").select("on_hand").eq("id", itemId).eq("farm_id", farm.id).maybeSingle();
    if (counted === null || counted < 0 || !item) return { error: t("stock.errCount") };
    quantity = Math.round((counted - Number(item.on_hand)) * 1000) / 1000;
    if (quantity === 0) return { success: t("stock.countMatches") };
  } else if (quantity === null || quantity <= 0) {
    return { error: t("stock.errQty") };
  }

  let unitCost: number | null = null;
  let totalCost: number | null = null;
  if (type === "purchase") {
    unitCost = num(formData, "unit_price");
    totalCost = unitCost !== null ? Math.round(quantity * unitCost * 100) / 100 : num(formData, "amount");
    if (totalCost !== null && totalCost < 0) return { error: t("finance.amountGreater") };
  }
  const flockId = str(formData, "flock_id");
  const usedBy = str(formData, "module");
  // Set by entries saved offline; a second copy of the same entry is ignored.
  const clientId = str(formData, "client_id");

  const { error } = await supabase.from("inventory_moves").insert({
    farm_id: farm.id,
    item_id: itemId,
    move_date: str(formData, "move_date"),
    move_type: type,
    quantity,
    unit_cost: unitCost,
    total_cost: totalCost,
    module: type === "use" && (MODULES as readonly string[]).includes(usedBy ?? "") ? usedBy : null,
    flock_id: type === "use" && flockId && UUID.test(flockId) ? flockId : null,
    supplier: type === "purchase" ? str(formData, "supplier") : null,
    notes: str(formData, "notes"),
    client_id: clientId && UUID.test(clientId) ? clientId : null,
  });
  if (error && !(error.code === "23505" && clientId)) return { error: dbError(t, error) };
  refresh();
  return { success: t(`stock.saved.${type}`) };
}

export async function deleteMove(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireRole(MANAGERS);
  const { t } = await getI18n();
  const id = str(formData, "id");
  if (!id || !UUID.test(id)) return { error: t("common.errorGeneric") };
  // Uses that come from a flock's daily log are changed there, not here.
  const { error } = await supabase.from("inventory_moves").delete().eq("id", id).eq("farm_id", farm.id).is("log_id", null);
  if (error) return { error: dbError(t, error) };
  refresh();
  return { success: t("stock.moveDeleted") };
}
