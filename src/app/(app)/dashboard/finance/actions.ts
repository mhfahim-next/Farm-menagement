"use server";

import { revalidatePath } from "next/cache";
import { requireRole, STAFF } from "@/lib/auth";
import { dbError, num, str } from "@/lib/form";
import { getI18n } from "@/lib/i18n/server";
import type { ActionState } from "@/lib/types";

export async function addTransaction(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireRole(STAFF);
  const { t } = await getI18n();
  const quantity = num(formData, "quantity");
  const unitPrice = num(formData, "unit_price");
  if ((quantity !== null && quantity <= 0) || (unitPrice !== null && unitPrice < 0)) return { error: t("finance.badQtyRate") };
  // With both a quantity and a rate, the stored total is always quantity × rate.
  const amount = quantity !== null && unitPrice !== null ? Math.round(quantity * unitPrice * 100) / 100 : num(formData, "amount");
  const category = str(formData, "category");
  if (!amount || amount <= 0) return { error: t("finance.amountGreater") };
  if (!category) return { error: t("finance.chooseCategory") };

  const { error } = await supabase.from("transactions").insert({
    farm_id: farm.id,
    txn_date: str(formData, "txn_date"),
    txn_type: str(formData, "txn_type") ?? "expense",
    module: str(formData, "module") ?? "general",
    category,
    amount,
    quantity,
    unit_price: unitPrice,
    description: str(formData, "description"),
  });
  if (error) return { error: dbError(t, error) };

  revalidatePath("/dashboard", "layout");
  return { success: t("finance.saved") };
}
