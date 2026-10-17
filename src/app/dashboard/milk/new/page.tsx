import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { ButtonLink, Card, EmptyState, Field, Input, PageHeader, Select, Table, Td } from "@/components/ui";
import { requireRole, STAFF } from "@/lib/auth";
import { milkingCategories } from "@/lib/cattle";
import { today } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { saveMilkSession } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("milk.recordButton") };
}

export default async function NewMilkPage({ searchParams }: PageProps<"/dashboard/milk/new">) {
  const { supabase, farm } = await requireRole(STAFF);
  if (!farm.has_dairy) notFound();
  const { t, options, rows } = await getI18n();
  const sessions = options("milk_session");

  const sp = await searchParams;
  const date = typeof sp.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : today();
  const session = sessions.find((s) => s.value === sp.session)?.value ?? sessions[0]?.value ?? "morning";

  const [cowsRes, existingRes] = await Promise.all([
    supabase
      .from("cattle")
      .select("id, tag_number, name")
      .eq("farm_id", farm.id)
      .eq("status", "active")
      .in("category", milkingCategories(rows))
      .is("deleted_at", null)
      .order("tag_number"),
    supabase
      .from("milk_records")
      .select("cattle_id, quantity_liters, fat_percent")
      .eq("farm_id", farm.id)
      .eq("record_date", date)
      .eq("session", session),
  ]);
  const cows = cowsRes.data ?? [];
  const existing = new Map((existingRes.data ?? []).map((r) => [r.cattle_id, r]));

  return (
    <>
      <PageHeader
        title={t("milk.recordButton")}
        description={t("milk.sheetDesc")}
        action={<ButtonLink href="/dashboard/milk" variant="secondary">{t("common.back")}</ButtonLink>}
      />
      <Card className="max-w-3xl">
          <form className="mb-4 flex flex-wrap items-end gap-2">
            <Field label={t("common.date")}>
              <Input name="date" type="date" defaultValue={date} max={today()} />
            </Field>
            <Field label={t("milk.session")}>
              <Select
                name="session"
                defaultValue={session}
                options={sessions}
              />
            </Field>
            <button className="rounded-lg border border-stone-300 px-3 py-2 text-sm hover:bg-stone-50">{t("common.load")}</button>
          </form>

          {cows.length === 0 ? (
            <EmptyState title={t("milk.noCowsTitle")}>{t("milk.noCowsBody")}</EmptyState>
          ) : (
            <ActionForm action={saveMilkSession} submitLabel={t("milk.saveMilking")} successHref="/dashboard/milk" key={`${date}-${session}`}>
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
    </>
  );
}
