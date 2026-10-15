"use server";

import { revalidatePath } from "next/cache";
import { requireRole, STAFF } from "@/lib/auth";
import { dbError, str } from "@/lib/form";
import { getI18n } from "@/lib/i18n/server";
import type { ActionState } from "@/lib/types";

/** Saves one milking session for many cows at once (re-saving overwrites). */
export async function saveMilkSession(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireRole(STAFF);
  const { t, f } = await getI18n();
  const recordDate = str(formData, "record_date");
  const session = str(formData, "session");
  if (!recordDate || !session) return { error: t("milk.chooseDateSession") };

  const rows: {
    farm_id: string;
    cattle_id: string;
    record_date: string;
    session: string;
    quantity_liters: number;
    fat_percent: number | null;
  }[] = [];

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("qty_") || typeof value !== "string" || value.trim() === "") continue;
    const cattleId = key.slice(4);
    const qty = Number(value);
    if (!Number.isFinite(qty) || qty < 0) return { error: t("milk.litresPositive") };
    const fatRaw = formData.get(`fat_${cattleId}`);
    const fat = typeof fatRaw === "string" && fatRaw.trim() !== "" ? Number(fatRaw) : null;
    rows.push({
      farm_id: farm.id,
      cattle_id: cattleId,
      record_date: recordDate,
      session,
      quantity_liters: qty,
      fat_percent: fat !== null && Number.isFinite(fat) ? fat : null,
    });
  }

  if (rows.length === 0) return { error: t("milk.enterOne") };

  const { error } = await supabase
    .from("milk_records")
    .upsert(rows, { onConflict: "cattle_id,record_date,session" });
  if (error) return { error: dbError(t, error) };

  revalidatePath("/dashboard", "layout");
  const total = rows.reduce((s, r) => s + r.quantity_liters, 0);
  return { success: t("milk.saved", { n: rows.length, l: f.number(total, 1) }) };
}
