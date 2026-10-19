"use server";

import { revalidatePath } from "next/cache";
import { MANAGERS, requireRole } from "@/lib/auth";
import { dbError } from "@/lib/form";
import { getI18n, getOptionRows } from "@/lib/i18n/server";
import { cleanRow, IMPORT_FIELDS, IMPORT_KINDS, MAX_IMPORT_ROWS, type CleanRow, type ImportKind } from "@/lib/import";

export type ImportRowInput = { row: number; cells: Record<string, string> };

export type ImportResult = {
  error?: string;
  success?: string;
  /** Rows that can be saved as they are. */
  ready?: number;
  /** Problems by spreadsheet row number. */
  problems?: { row: number; messages: string[] }[];
};

/**
 * Checks rows from an uploaded sheet (commit = false) or saves them
 * (commit = true, after the same checks). Nothing is saved while any row has a problem.
 */
export async function runImport(kind: ImportKind, input: ImportRowInput[], commit: boolean): Promise<ImportResult> {
  const { supabase, farm } = await requireRole(MANAGERS);
  const { t } = await getI18n();
  const options = await getOptionRows();
  if (!(IMPORT_KINDS as readonly string[]).includes(kind)) return { error: t("common.errorGeneric") };
  if ((kind === "cattle" || kind === "milk") && !farm.has_dairy) return { error: t("import.noDairy") };
  if (kind === "flock" && !farm.has_layer) return { error: t("import.noLayer") };
  if (!Array.isArray(input) || input.length === 0) return { error: t("import.noRows") };
  if (input.length > MAX_IMPORT_ROWS) return { error: t("import.tooMany", { n: MAX_IMPORT_ROWS }) };

  const fieldLabel = (key: string) => t(IMPORT_FIELDS[kind].find((f) => f.key === key)?.label ?? "import.f.notes");
  const clean: CleanRow[] = input.map((r) => cleanRow(kind, Number(r.row) || 0, r.cells && typeof r.cells === "object" ? r.cells : {}, options));
  const extra = new Map<number, string[]>();
  const add = (row: number, message: string) => extra.set(row, [...(extra.get(row) ?? []), message]);
  const v = (r: CleanRow, k: string) => r.values[k];
  const lower = (x: unknown) => String(x ?? "").trim().toLowerCase();

  // Farm-specific checks: tags and flocks that must (or must not) exist, repeats inside the file.
  const insertRows: Record<string, unknown>[] = [];
  if (kind === "cattle") {
    const { data } = await supabase.from("cattle").select("tag_number").eq("farm_id", farm.id);
    const taken = new Set((data ?? []).map((c) => lower(c.tag_number)));
    const seen = new Set<string>();
    for (const r of clean) {
      const tag = lower(v(r, "tag_number"));
      if (!tag) continue;
      if (taken.has(tag)) add(r.row, t("import.err.tagExists", { tag: String(v(r, "tag_number")) }));
      else if (seen.has(tag)) add(r.row, t("import.err.repeat"));
      seen.add(tag);
      insertRows.push({
        farm_id: farm.id,
        tag_number: v(r, "tag_number"),
        name: v(r, "name"),
        category: v(r, "category"),
        breed: v(r, "breed"),
        date_of_birth: v(r, "date_of_birth"),
        purchase_date: v(r, "purchase_date"),
        purchase_price: v(r, "purchase_price"),
        notes: v(r, "notes"),
      });
    }
  } else if (kind === "milk") {
    const { data } = await supabase.from("cattle").select("id, tag_number").eq("farm_id", farm.id).is("deleted_at", null);
    const byTag = new Map((data ?? []).map((c) => [lower(c.tag_number), c.id as string]));
    const seen = new Set<string>();
    for (const r of clean) {
      const tag = lower(v(r, "tag_number"));
      if (!tag) continue;
      const id = byTag.get(tag);
      if (!id) add(r.row, t("import.err.unknownTag", { tag: String(v(r, "tag_number")) }));
      const key = `${tag}|${v(r, "record_date")}|${v(r, "session")}`;
      if (seen.has(key)) add(r.row, t("import.err.repeat"));
      seen.add(key);
      insertRows.push({
        farm_id: farm.id,
        cattle_id: id,
        record_date: v(r, "record_date"),
        session: v(r, "session"),
        quantity_liters: v(r, "quantity_liters"),
        fat_percent: v(r, "fat_percent"),
      });
    }
  } else if (kind === "flock") {
    const { data } = await supabase.from("flocks").select("id, name").eq("farm_id", farm.id).is("deleted_at", null);
    const byName = new Map((data ?? []).map((x) => [lower(x.name), x.id as string]));
    const seen = new Set<string>();
    for (const r of clean) {
      const name = lower(v(r, "flock_name"));
      if (!name) continue;
      const id = byName.get(name);
      if (!id) add(r.row, t("import.err.unknownFlock", { name: String(v(r, "flock_name")) }));
      const key = `${name}|${v(r, "log_date")}`;
      if (seen.has(key)) add(r.row, t("import.err.repeat"));
      seen.add(key);
      insertRows.push({
        farm_id: farm.id,
        flock_id: id,
        log_date: v(r, "log_date"),
        eggs_collected: v(r, "eggs_collected") ?? 0,
        eggs_broken: v(r, "eggs_broken") ?? 0,
        mortality: v(r, "mortality") ?? 0,
        culled: v(r, "culled") ?? 0,
        feed_kg: v(r, "feed_kg"),
        water_liters: v(r, "water_liters"),
        notes: v(r, "notes"),
      });
    }
  } else {
    for (const r of clean) {
      const section = v(r, "module") ?? "general";
      if ((section === "dairy" && !farm.has_dairy) || (section === "layer" && !farm.has_layer)) add(r.row, t("import.err.section"));
      insertRows.push({
        farm_id: farm.id,
        txn_date: v(r, "txn_date"),
        txn_type: v(r, "txn_type"),
        module: section,
        category: v(r, "category"),
        amount: v(r, "amount"),
        description: v(r, "description"),
      });
    }
  }

  const problems = clean
    .map((r) => ({
      row: r.row,
      messages: [...r.errors.map((e) => `${fieldLabel(e.field)}: ${t(`import.err.${e.code}`)}`), ...(extra.get(r.row) ?? [])],
    }))
    .filter((p) => p.messages.length > 0);
  const ready = clean.length - problems.length;

  if (!commit || problems.length > 0) return { ready, problems };

  // One statement, so a plan limit or a clash saves nothing rather than half the file.
  const { error } =
    kind === "cattle"
      ? await supabase.from("cattle").insert(insertRows)
      : kind === "milk"
        ? await supabase.from("milk_records").upsert(insertRows, { onConflict: "cattle_id,record_date,session" })
        : kind === "flock"
          ? await supabase.from("flock_daily_logs").upsert(insertRows, { onConflict: "flock_id,log_date" })
          : await supabase.from("transactions").insert(insertRows);
  if (error) return { error: dbError(t, error), ready, problems };
  revalidatePath("/dashboard", "layout");
  return { success: t("import.done", { n: insertRows.length }), ready, problems: [] };
}
