"use server";

import { revalidatePath } from "next/cache";
import { requireFarm } from "@/lib/auth";
import { dbError, num, str } from "@/lib/form";
import { getI18n } from "@/lib/i18n/server";
import type { ActionState } from "@/lib/types";

export async function addTransaction(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireFarm();
  const { t } = await getI18n();
  const amount = num(formData, "amount");
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
    description: str(formData, "description"),
  });
  if (error) return { error: dbError(t, error) };

  revalidatePath("/dashboard", "layout");
  return { success: t("finance.saved") };
}
