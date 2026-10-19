"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { runImport, type ImportResult } from "@/app/dashboard/import/actions";
import { useI18n } from "@/components/i18n-provider";
import { useToast } from "@/components/toast";
import { Button, Card, Select, Spinner } from "@/components/ui";
import { toCsv } from "@/lib/csv";
import { guessMapping, IMPORT_FIELDS, MAX_IMPORT_ROWS, parseDate, templateRows, type ImportKind } from "@/lib/import";
import { readSheet } from "@/lib/import-file";

const NEXT_PAGE: Record<ImportKind, string> = {
  cattle: "/dashboard/cattle",
  milk: "/dashboard/milk",
  flock: "/dashboard/flocks",
  finance: "/dashboard/finance",
};

/** Spreadsheet column letter: 0 → A, 26 → AA. */
function letter(i: number) {
  let s = "";
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

export function ImportWizard({ kinds }: { kinds: ImportKind[] }) {
  const { t, f } = useI18n();
  const { toast } = useToast();
  const [kind, setKind] = useState<ImportKind>(kinds[0]);
  const [file, setFile] = useState<{ name: string; header: string[]; rows: { row: number; cells: string[] }[] } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [mapping, setMapping] = useState<Record<string, number>>({});
  const [result, setResult] = useState<ImportResult | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const fields = IMPORT_FIELDS[kind];

  const chooseKind = (k: ImportKind) => {
    setKind(k);
    setResult(null);
    setDone(null);
    if (file) setMapping(guessMapping(k, file.header, (key) => t(key)));
  };

  const downloadTemplate = () => {
    const { header, example } = templateRows(kind, (key) => t(key));
    const blob = new Blob([toCsv(header, [example])], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `farmflows-${kind}-template.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const onFile = async (input: File | undefined) => {
    setResult(null);
    setDone(null);
    setFileError(null);
    setFile(null);
    if (!input) return;
    try {
      const sheet = await readSheet(input);
      // The first row with something in it holds the headings.
      const at = sheet.findIndex((r) => r.some((c) => c.trim() !== ""));
      if (at < 0) throw new Error("empty");
      const header = sheet[at].map((c) => c.trim());
      const rows = sheet
        .slice(at + 1)
        .map((cells, i) => ({ row: at + 2 + i, cells }))
        .filter((r) => r.cells.some((c) => c.trim() !== ""));
      if (rows.length === 0) throw new Error("empty");
      if (rows.length > MAX_IMPORT_ROWS) {
        setFileError(t("import.tooMany", { n: MAX_IMPORT_ROWS }));
        return;
      }
      setFile({ name: input.name, header, rows });
      setMapping(guessMapping(kind, header, (key) => t(key)));
    } catch (e) {
      setFileError(e instanceof Error && e.message === "unsupported" ? t("import.badType") : e instanceof Error && e.message === "empty" ? t("import.noRows") : t("import.unreadable"));
    }
  };

  const payload = useMemo(
    () =>
      (file?.rows ?? []).map((r) => ({
        row: r.row,
        cells: Object.fromEntries(fields.filter((x) => mapping[x.key] !== undefined).map((x) => [x.key, String(r.cells[mapping[x.key]] ?? "")])),
      })),
    [file, fields, mapping],
  );
  const missing = fields.filter((x) => x.required && mapping[x.key] === undefined);
  const badRows = new Set((result?.problems ?? []).map((p) => p.row));
  const goodRows = payload.filter((r) => !badRows.has(r.row));

  const check = () =>
    start(async () => {
      setDone(null);
      const res = await runImport(kind, payload, false);
      setResult(res);
      if (res.error) toast("error", res.error);
    });

  const save = () =>
    start(async () => {
      const res = await runImport(kind, goodRows, true);
      if (res.error) {
        toast("error", res.error);
        setResult(res);
        return;
      }
      toast("success", res.success ?? "");
      setDone(res.success ?? "");
      setResult(null);
      setFile(null);
    });

  return (
    <div className="grid max-w-4xl gap-5">
      <Card title={t("import.step1")}>
        <div role="radiogroup" className="grid gap-2 sm:grid-cols-2">
          {kinds.map((k) => (
            <label
              key={k}
              className={`flex cursor-pointer gap-3 rounded-lg border p-3 text-sm ${kind === k ? "border-emerald-600 bg-emerald-50" : "border-stone-200 hover:bg-stone-50"}`}
            >
              <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => chooseKind(k)} className="mt-0.5 accent-emerald-700" />
              <span>
                <span className="block font-semibold text-stone-900">{t(`import.kind.${k}`)}</span>
                <span className="text-stone-600">{t(`import.kindDesc.${k}`)}</span>
              </span>
            </label>
          ))}
        </div>
        <p className="mt-4 text-sm text-stone-600">
          {t("import.templateHint")}{" "}
          <button type="button" onClick={downloadTemplate} className="font-medium text-emerald-700 underline" data-testid="template">
            {t("import.template")}
          </button>
        </p>
        <p className="mt-1 text-xs text-stone-500">
          {t("import.columns")}: {fields.map((x) => t(x.label) + (x.required ? " *" : "")).join(", ")}
        </p>
      </Card>

      <Card title={t("import.step2")} description={t("import.fileHint", { n: f.number(MAX_IMPORT_ROWS) })}>
        <input
          type="file"
          accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(e) => {
            onFile(e.target.files?.[0]);
            // Clear the picker so choosing the same file again (after fixing it) reads it again.
            e.target.value = "";
          }}
          className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-700 file:px-4 file:py-2 file:font-medium file:text-white"
          data-testid="import-file"
        />
        {fileError && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{fileError}</p>}
        {file && (
          <p className="mt-3 text-sm text-stone-700">
            {t("import.fileRead", { name: file.name, n: file.rows.length })}
          </p>
        )}
        {done && (
          <div role="status" className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            ✓ {done}{" "}
            <Link href={NEXT_PAGE[kind]} className="font-medium underline">
              {t("import.view")}
            </Link>
          </div>
        )}
      </Card>

      {file && (
        <Card title={t("import.step3")} description={t("import.mapHint")}>
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((x) => (
              <label key={x.key} className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-stone-700">
                  {t(x.label)}
                  {x.required && <span className="text-red-600"> *</span>}
                </span>
                <Select
                  name={`map_${x.key}`}
                  value={mapping[x.key] === undefined ? "" : String(mapping[x.key])}
                  onChange={(e) => {
                    const next = { ...mapping };
                    if (e.target.value === "") delete next[x.key];
                    else next[x.key] = Number(e.target.value);
                    setMapping(next);
                    setResult(null);
                  }}
                  options={[
                    { value: "", label: t("import.notInFile") },
                    ...file.header.map((h, i) => ({ value: String(i), label: `${letter(i)} · ${h || "—"}` })),
                  ]}
                />
                {mapping[x.key] !== undefined && file.rows[0] && (
                  <span className="truncate text-xs text-stone-500">
                    {t("import.example")}: {(() => {
                      const raw = file.rows[0].cells[mapping[x.key]] ?? "";
                      const date = x.type === "date" && raw ? parseDate(raw) : null;
                      return date ? f.date(date) : raw || "—";
                    })()}
                  </span>
                )}
              </label>
            ))}
          </div>
          {missing.length > 0 && (
            <p role="alert" className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {t("import.missing", { fields: missing.map((x) => t(x.label)).join(", ") })}
            </p>
          )}
          {kind === "milk" || kind === "flock" ? <p className="mt-3 text-xs text-stone-500">{t("import.overwriteNote")}</p> : null}
          {kind === "finance" && <p className="mt-3 text-xs text-stone-500">{t("import.financeNote")}</p>}
          <div className="mt-4">
            <Button type="button" onClick={check} disabled={pending || missing.length > 0} data-testid="import-check">
              {pending && !result && <Spinner className="mr-2" />}
              {t("import.check")}
            </Button>
          </div>
        </Card>
      )}

      {file && result && !result.error && (
        <Card title={t("import.step4")}>
          <p className="text-sm text-stone-700" data-testid="import-summary">
            {t("import.summary", { ok: result.ready ?? 0, bad: result.problems?.length ?? 0 })}
          </p>
          {(result.problems?.length ?? 0) > 0 && (
            <>
              <p className="mt-2 text-sm text-stone-600">{t("import.fixHint")}</p>
              <ul className="mt-3 max-h-80 divide-y divide-red-100 overflow-y-auto rounded-lg border border-red-200 bg-red-50/50 text-sm" data-testid="import-problems">
                {result.problems!.slice(0, 200).map((p) => (
                  <li key={p.row} className="px-3 py-2">
                    <span className="font-semibold text-red-800">{t("import.row", { n: p.row })}</span>{" "}
                    <span className="text-red-700">{p.messages.join(" · ")}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {(result.ready ?? 0) > 0 && (
            <div className="mt-4">
              <Button type="button" onClick={save} disabled={pending} data-testid="import-save">
                {pending && <Spinner className="mr-2" />}
                {badRows.size > 0 ? t("import.saveSome", { n: goodRows.length, skip: badRows.size }) : t("import.saveAll", { n: goodRows.length })}
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
