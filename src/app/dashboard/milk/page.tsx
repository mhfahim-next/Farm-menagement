import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { Card, EmptyState, Field, Input, PageHeader, Select, StatCard, Table, Td } from "@/components/ui";
import { requireFarm } from "@/lib/auth";
import { today } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { saveMilkSession } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("milk.meta") };
}

const sessionValues = ["morning", "evening", "other"] as const;

export default async function MilkPage({ searchParams }: PageProps<"/dashboard/milk">) {
  const { supabase, farm } = await requireFarm();
  if (!farm.has_dairy) notFound();
  const { t, e, f } = await getI18n();

  const sp = await searchParams;
  const date = typeof sp.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : today();
  const session = sessionValues.find((s) => s === sp.session) ?? "morning";

  const [cowsRes, existingRes, historyRes] = await Promise.all([
    supabase
      .from("cattle")
      .select("id, tag_number, name")
      .eq("farm_id", farm.id)
      .eq("status", "active")
      .eq("category", "cow")
      .is("deleted_at", null)
      .order("tag_number"),
    supabase
      .from("milk_records")
      .select("cattle_id, quantity_liters, fat_percent")
      .eq("farm_id", farm.id)
      .eq("record_date", date)
      .eq("session", session),
    supabase
      .from("milk_records")
      .select("record_date, session, quantity_liters")
      .eq("farm_id", farm.id)
      .gte("record_date", today(-29))
      .order("record_date", { ascending: false }),
  ]);

  const cows = cowsRes.data ?? [];
  const existing = new Map((existingRes.data ?? []).map((r) => [r.cattle_id, r]));
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
      <PageHeader title={t("milk.title")} description={t("milk.desc")} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={t("milk.today")}
          value={liters(history.filter((r) => r.record_date === today()).reduce((s, r) => s + Number(r.quantity_liters), 0))}
        />
        <StatCard label={t("milk.last30")} value={liters(total30, 0)} />
        <StatCard label={t("milk.dailyAvg")} value={liters(days.length ? total30 / days.length : 0)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card title={t("milk.sheetTitle")} description={t("milk.sheetDesc")}>
          <form className="mb-4 flex flex-wrap items-end gap-2">
            <Field label={t("common.date")}>
              <Input name="date" type="date" defaultValue={date} max={today()} />
            </Field>
            <Field label={t("milk.session")}>
              <Select
                name="session"
                defaultValue={session}
                options={sessionValues.map((s) => ({ value: s, label: e(s) }))}
              />
            </Field>
            <button className="rounded-lg border border-stone-300 px-3 py-2 text-sm hover:bg-stone-50">{t("common.load")}</button>
          </form>

          {cows.length === 0 ? (
            <EmptyState title={t("milk.noCowsTitle")}>{t("milk.noCowsBody")}</EmptyState>
          ) : (
            <ActionForm action={saveMilkSession} submitLabel={t("milk.saveMilking")} key={`${date}-${session}`}>
              <input type="hidden" name="record_date" value={date} />
              <input type="hidden" name="session" value={session} />
              <Table head={[t("milk.colCow"), t("milk.colLitres"), t("milk.colFat")]}>
                {cows.map((c) => {
                  const r = existing.get(c.id);
                  return (
                    <tr key={c.id}>
                      <Td>
                        <span className="font-medium">{c.tag_number}</span>
                        {c.name && <span className="text-stone-500"> · {c.name}</span>}
                      </Td>
                      <Td>
                        <Input
                          name={`qty_${c.id}`}
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="0.01"
                          defaultValue={r?.quantity_liters ?? ""}
                          className="w-28"
                        />
                      </Td>
                      <Td>
                        <Input
                          name={`fat_${c.id}`}
                          type="number"
                          inputMode="decimal"
                          min="0"
                          max="15"
                          step="0.01"
                          defaultValue={r?.fat_percent ?? ""}
                          className="w-24"
                        />
                      </Td>
                    </tr>
                  );
                })}
              </Table>
            </ActionForm>
          )}
        </Card>

        <Card title={t("milk.totalsTitle")}>
          {days.length === 0 ? (
            <EmptyState title={t("milk.totalsEmpty")} />
          ) : (
            <Table head={[t("milk.colDate"), t("milk.colMorning"), t("milk.colEvening"), t("milk.colTotal")]}>
              {days.map(([d, v]) => (
                <tr key={d}>
                  <Td>{f.date(d)}</Td>
                  <Td className="tabular-nums">{f.number(v.morning, 1)}</Td>
                  <Td className="tabular-nums">{f.number(v.evening, 1)}</Td>
                  <Td className="font-medium tabular-nums">{liters(v.morning + v.evening + v.other)}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}
