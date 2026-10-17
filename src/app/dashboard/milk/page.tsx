import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClickRow } from "@/components/click-row";
import { ButtonLink, Card, EmptyState, PageHeader, StatCard, Table, Td } from "@/components/ui";
import { requireRole, STAFF } from "@/lib/auth";
import { today } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("milk.meta") };
}

export default async function MilkPage() {
  const { supabase, farm } = await requireRole(STAFF);
  if (!farm.has_dairy) notFound();
  const { t, f } = await getI18n();
  const [historyRes] = await Promise.all([
    supabase
      .from("milk_records")
      .select("record_date, session, quantity_liters")
      .eq("farm_id", farm.id)
      .gte("record_date", today(-29))
      .order("record_date", { ascending: false }),
  ]);

  const history = historyRes.data ?? [];

  const byDay = new Map<string, { morning: number; evening: number; other: number }>();
  for (const r of history) {
    const d = byDay.get(r.record_date) ?? { morning: 0, evening: 0, other: 0 };
    d[r.session as "morning" | "evening" | "other"] += Number(r.quantity_liters);
    byDay.set(r.record_date, d);
  }
  const days = [...byDay.entries()];
  const total30 = history.reduce((s, r) => s + Number(r.quantity_liters), 0);
  const liters = (n: number, digits = 1) => t("common.litersShort", { n: f.number(n, digits) });

  return (
    <>
      <PageHeader
        title={t("milk.title")}
        description={t("milk.desc")}
        action={<ButtonLink href="/dashboard/milk/new">+ {t("milk.recordButton")}</ButtonLink>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={t("milk.today")}
          value={liters(history.filter((r) => r.record_date === today()).reduce((s, r) => s + Number(r.quantity_liters), 0))}
        />
        <StatCard label={t("milk.last30")} value={liters(total30, 0)} />
        <StatCard label={t("milk.dailyAvg")} value={liters(days.length ? total30 / days.length : 0)} />
      </div>

      <div className="mt-6">
        <Card title={t("milk.totalsTitle")}>
          {days.length === 0 ? (
            <EmptyState title={t("milk.totalsEmpty")} />
          ) : (
            <Table head={[t("milk.colDate"), t("milk.colMorning"), t("milk.colEvening"), t("milk.colTotal")]}>
              {days.map(([d, v]) => (
                <ClickRow key={d} href={`/dashboard/milk/new?date=${d}`}>
                  <Td>{f.date(d)}</Td>
                  <Td className="tabular-nums">{f.number(v.morning, 1)}</Td>
                  <Td className="tabular-nums">{f.number(v.evening, 1)}</Td>
                  <Td className="font-medium tabular-nums">{liters(v.morning + v.evening + v.other)}</Td>
                </ClickRow>
              ))}
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}
