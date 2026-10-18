"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { MANAGERS, requireRole, STAFF } from "@/lib/auth";
import { dbError, num, str } from "@/lib/form";
import { getI18n } from "@/lib/i18n/server";
import { PAY_METHODS, PRODUCT_DEFAULTS, PRODUCTS, SALE_UNITS, type Product, type SaleUnit } from "@/lib/trade";
import type { ActionState } from "@/lib/types";

const UUID = /^[0-9a-f-]{36}$/i;
const uuidOrNull = (v: string | null) => (v && UUID.test(v) ? v : null);

function refresh() {
  revalidatePath("/dashboard", "layout");
}

// ---------------------------------------------------------------------
// Buyers
// ---------------------------------------------------------------------
function buyerFields(formData: FormData) {
  return {
    name: str(formData, "name"),
    phone: str(formData, "phone"),
    milk_rate: num(formData, "milk_rate"),
    egg_rate: num(formData, "egg_rate"),
    notes: str(formData, "notes"),
  };
}

export async function createBuyer(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireRole(STAFF);
  const { t } = await getI18n();
  const v = buyerFields(formData);
  if (!v.name) return { error: t("sales.errBuyerName") };
  const { data, error } = await supabase.from("buyers").insert({ farm_id: farm.id, ...v }).select("id").single();
  if (error) return { error: error.code === "23505" ? t("sales.errBuyerTaken") : dbError(t, error) };
  refresh();
  // Coming from the sale form: go back to it with this buyer chosen.
  const back = str(formData, "back");
  if (back === "sale") redirect(`/dashboard/sales/new?buyer=${data.id}`);
  redirect(`/dashboard/sales/buyers/${data.id}`);
}

export async function updateBuyer(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireRole(STAFF);
  const { t } = await getI18n();
  const id = uuidOrNull(str(formData, "id"));
  const v = buyerFields(formData);
  if (!id) return { error: t("common.errorGeneric") };
  if (!v.name) return { error: t("sales.errBuyerName") };
  const { error } = await supabase
    .from("buyers")
    .update({ ...v, archived: formData.get("archived") === "on" })
    .eq("id", id)
    .eq("farm_id", farm.id);
  if (error) return { error: error.code === "23505" ? t("sales.errBuyerTaken") : dbError(t, error) };
  refresh();
  return { success: t("sales.buyerSaved") };
}

// ---------------------------------------------------------------------
// Sales
// ---------------------------------------------------------------------
export async function addSale(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireRole(STAFF);
  const { t } = await getI18n();
  const product = str(formData, "product") as Product | null;
  if (!product || !(PRODUCTS as readonly string[]).includes(product)) return { error: t("sales.errProduct") };
  const unitRaw = str(formData, "unit");
  const unit: SaleUnit = (SALE_UNITS as readonly string[]).includes(unitRaw ?? "") ? (unitRaw as SaleUnit) : PRODUCT_DEFAULTS[product].unit;

  const quantity = num(formData, "quantity");
  const unitPrice = num(formData, "unit_price");
  if (quantity === null || quantity <= 0) return { error: t("sales.errQty") };
  const amount = unitPrice !== null ? Math.round(quantity * unitPrice * 100) / 100 : num(formData, "amount");
  if (amount === null || amount <= 0) return { error: t("finance.amountGreater") };

  const buyerId = uuidOrNull(str(formData, "buyer_id"));
  // Without a buyer the sale is cash: paid in full.
  const paid = buyerId ? Math.min(num(formData, "paid_amount") ?? 0, amount) : amount;
  if (paid < 0) return { error: t("sales.errPaid") };

  const cattleId = product === "animal" ? uuidOrNull(str(formData, "cattle_id")) : null;
  const flockId = product === "eggs" || product === "animal" ? uuidOrNull(str(formData, "flock_id")) : null;
  // Which part of the farm earned it: milk/cows → dairy, eggs/hens → layer.
  const moduleRaw = str(formData, "module");
  const section =
    product === "milk" || cattleId ? "dairy"
    : product === "eggs" || flockId ? "layer"
    : moduleRaw === "dairy" || moduleRaw === "layer" ? moduleRaw
    : PRODUCT_DEFAULTS[product].module;

  const { error } = await supabase.from("sales").insert({
    farm_id: farm.id,
    buyer_id: buyerId,
    sale_date: str(formData, "sale_date"),
    product,
    module: section,
    quantity,
    unit,
    unit_price: unitPrice,
    amount,
    paid_amount: paid,
    fat_percent: product === "milk" ? num(formData, "fat_percent") : null,
    snf_percent: product === "milk" ? num(formData, "snf_percent") : null,
    cattle_id: cattleId,
    flock_id: flockId,
    notes: str(formData, "notes"),
  });
  if (error) return { error: dbError(t, error) };
  refresh();
  return { success: t("sales.saleSaved") };
}

export async function deleteSale(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireRole(MANAGERS);
  const { t } = await getI18n();
  const id = uuidOrNull(str(formData, "id"));
  if (!id) return { error: t("common.errorGeneric") };
  const { error } = await supabase.from("sales").delete().eq("id", id).eq("farm_id", farm.id);
  if (error) return { error: dbError(t, error) };
  refresh();
  return { success: t("sales.saleDeleted") };
}

// ---------------------------------------------------------------------
// Payments from buyers
// ---------------------------------------------------------------------
export async function addPayment(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireRole(STAFF);
  const { t } = await getI18n();
  const buyerId = uuidOrNull(str(formData, "buyer_id"));
  const amount = num(formData, "amount");
  const method = str(formData, "method");
  if (!buyerId) return { error: t("sales.errBuyer") };
  if (amount === null || amount <= 0) return { error: t("finance.amountGreater") };
  const { error } = await supabase.from("buyer_payments").insert({
    farm_id: farm.id,
    buyer_id: buyerId,
    pay_date: str(formData, "pay_date"),
    amount,
    method: (PAY_METHODS as readonly string[]).includes(method ?? "") ? method : "cash",
    notes: str(formData, "notes"),
  });
  if (error) return { error: dbError(t, error) };
  refresh();
  return { success: t("sales.paymentSaved") };
}

export async function deletePayment(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireRole(MANAGERS);
  const { t } = await getI18n();
  const id = uuidOrNull(str(formData, "id"));
  if (!id) return { error: t("common.errorGeneric") };
  const { error } = await supabase.from("buyer_payments").delete().eq("id", id).eq("farm_id", farm.id);
  if (error) return { error: dbError(t, error) };
  refresh();
  return { success: t("sales.paymentDeleted") };
}
