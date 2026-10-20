import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/print-button";
import { Card, PageHeader, Select } from "@/components/ui";
import { requireRole, STAFF } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { animalUrl, qrSvg } from "@/lib/qr";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("print.tagsTitle") };
}

const STATUSES = ["active", "sold", "dead", "archived", "all"] as const;
const SIZES = ["small", "medium", "large"] as const;
// Labels per row on paper, and the QR width that fits.
const GRID = {
  small: { cols: "grid-cols-2 sm:grid-cols-4", qr: "w-24" },
  medium: { cols: "grid-cols-2 sm:grid-cols-3", qr: "w-32" },
  large: { cols: "grid-cols-1 sm:grid-cols-2", qr: "w-44" },
} as const;
const PRINT_COLS = { small: "print:grid-cols-4", medium: "print:grid-cols-3", large: "print:grid-cols-2" } as const;

export default async function AnimalTagsPage({ searchParams }: PageProps<"/dashboard/cattle/tags">) {
  const { supabase, farm } = await requireRole(STAFF);
  if (!farm.has_dairy) notFound();
  const { t, e, o } = await getI18n();

  const sp = await searchParams;
  const status = STATUSES.find((s) => s === sp.status) ?? "active";
  const size = SIZES.find((s) => s === sp.size) ?? "medium";

  let query = supabase.from("cattle").select("id, tag_number, name, category, status").eq("farm_id", farm.id).is("deleted_at", null).order("tag_number");
  if (status !== "all") query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const animals = data ?? [];
  const codes = await Promise.all(animals.map((a) => qrSvg(animalUrl(a.id))));

  return (
    <>
      <div className="print:hidden">
        <PageHeader
          title={t("print.tagsTitle")}
          description={t("print.tagsDesc")}
          action={
            <Link href="/dashboard/cattle" className="text-sm text-stone-500 hover:text-stone-900">
              {t("cattle.allCattle")}
            </Link>
          }
        />
        <Card>
          <form className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-stone-700">{t("common.status")}</span>
              <Select
                name="status"
                defaultValue={status}
                className="w-auto"
                options={STATUSES.map((s) => ({ value: s, label: s === "all" ? e("all") : o("cattle_status", s) }))}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-stone-700">{t("print.size")}</span>
              <Select name="size" defaultValue={size} className="w-auto" options={SIZES.map((s) => ({ value: s, label: t(`print.size.${s}`) }))} />
            </label>
            <button className="rounded-lg border border-stone-300 px-3 py-2 text-sm hover:bg-stone-50">{t("common.filter")}</button>
            <span className="ml-auto flex items-center gap-3">
              <span className="text-sm text-stone-600">{t("print.count", { n: animals.length })}</span>
              {animals.length > 0 && <PrintButton label={t("print.button")} />}
            </span>
          </form>
          <p className="mt-3 text-xs text-stone-500">{t("print.tagsHowTo")}</p>
        </Card>
      </div>

      {animals.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-stone-300 p-8 text-center text-stone-500 print:hidden">{t("print.noAnimals")}</p>
      ) : (
        <ul data-testid="tag-grid" className={`mt-6 grid gap-3 print:mt-0 print:gap-2 ${GRID[size].cols} ${PRINT_COLS[size]}`}>
          {animals.map((a, i) => (
            <li
              key={a.id}
              data-testid="tag"
              className="flex break-inside-avoid flex-col items-center rounded-xl border border-stone-300 bg-white p-3 text-center print:rounded-lg print:border-stone-400"
            >
              <div
                role="img"
                aria-label={`QR ${a.tag_number}`}
                className={`${GRID[size].qr} shrink-0 bg-white [&>svg]:h-auto [&>svg]:w-full`}
                // Our own generated SVG (a QR code for this animal's link).
                dangerouslySetInnerHTML={{ __html: codes[i] }}
              />
              <p className="mt-2 break-all text-2xl font-extrabold leading-tight text-stone-900">{a.tag_number}</p>
              {a.name && <p className="break-words text-sm font-medium text-stone-700">{a.name}</p>}
              <p className="mt-0.5 text-[11px] text-stone-500">
                {o("cattle_category", a.category)} · {farm.name}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
