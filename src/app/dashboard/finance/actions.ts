"use server";

import { revalidatePath } from "next/cache";
import { requireFarm } from "@/lib/auth";
import { dbError, num, str } from "@/lib/form";
import type { ActionState } from "@/lib/types";

export async function addTransaction(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireFarm();
  const amount = num(formData, "amount");
  const category = str(formData, "category");
  if (!amount || amount <= 0) return { error: "Enter an amount greater than zero." };
  if (!category) return { error: "Choose a category." };

  const { error } = await supabase.from("transactions").insert({
    farm_id: farm.id,
    txn_date: str(formData, "txn_date"),
    txn_type: str(formData, "txn_type") ?? "expense",
    module: str(formData, "module") ?? "general",
    category,
    amount,
    description: str(formData, "description"),
  });
  if (error) return { error: dbError(error) };

  revalidatePath("/dashboard", "layout");
  return { success: "Transaction saved." };
}
