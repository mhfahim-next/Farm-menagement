import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, Card, Field, Input, PageHeader } from "@/components/ui";
import { requireRole, STAFF } from "@/lib/auth";
import { today } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { getPlanContext } from "@/lib/plans";
import { keepsAnimals, keepsPoultry } from "@/lib/modules";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("reports.meta") };
}

const reports = [
  { kind: "cattle", dated: false, dairy: true },
  { kind: "milk", dated: true, dairy: true },
  { kind: "weights", dated: true, dairy: true },
  { kind: "health", dated: true, dairy: true },
  { kind: "breeding", dated: true, dairy: true },
  { kind: "flocks", dated: true, layer: true },
  { kind: "sales", dated: true },
  { kind: "stock", dated: true },
  { kind: "finance", dated: true },
] as const;

export default async function ReportsPage() {
  const { farm, role } = await requireRole(STAFF);
  const { t } = await getI18n();
  const { plan } = await getPlanContext();
  const allowed = Boolean(plan?.can_export);
  const canUpgrade = role === "owner" || role === "manager";
  const shown = reports.filter((r) => !("dairy" in r && r.dairy && !keepsAnimals(farm)) && !("layer" in r && r.layer && !keepsPoultry(farm)));

  return (
    <>
      <PageHeader title={t("reports.title")} description={t("reports.desc")} />

      {!allowed && (
        <div data-testid="reports-locked" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-900">
          <div>
            <p className="font-semibold">{t("reports.lockedTitle")}</p>
            <p className="text-sm">{t("reports.lockedBody")}</p>
          </div>
          {canUpgrade && <ButtonLink href="/dashboard/plan">{t("plan.upgradeNow")}</ButtonLink>}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {shown.map((r) => (
          <Card key={r.kind} title={t(`reports.${r.kind}`)} description={t(`reports.${r.kind}Desc`)} className={allowed ? "" : "opacity-60"}>
            <form action="/dashboard/reports/export" method="get" className="grid gap-3">
              <input type="hidden" name="kind" value={r.kind} />
              {r.dated && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t("reports.from")}>
                    <Input name="from" type="date" defaultValue={today(-29)} disabled={!allowed} />
                  </Field>
                  <Field label={t("reports.to")}>
                    <Input name="to" type="date" defaultValue={today()} disabled={!allowed} />
                  </Field>
                </div>
              )}
              <div>
                <button
                  type="submit"
                  disabled={!allowed}
                  data-testid={`export-${r.kind}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {allowed ? "⬇ " : "🔒 "}
                  {t("reports.download")}
                </button>
              </div>
            </form>
          </Card>
        ))}
      </div>
      <p className="mt-6 text-sm text-stone-500">
        <Link href="/dashboard/plan" className="text-emerald-700 hover:underline">
          {t("nav.plan")}
        </Link>
      </p>
    </>
  );
}
