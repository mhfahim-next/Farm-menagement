import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { ParentsFields } from "@/components/parents-fields";
import { Badge, Card, EmptyState, Field, Input, PageHeader, Select, Table, Td, Textarea } from "@/components/ui";
import { LimitNotice } from "@/components/limit-notice";
import { MANAGERS, requireFarm } from "@/lib/auth";
import { getPlanContext } from "@/lib/plans";
import { planName } from "@/lib/plan-utils";
import { breedOptions, typeSexHint, type MotherCandidate } from "@/lib/cattle";
import { ageInMonths } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import type { Cattle } from "@/lib/types";
import { addCattle } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("cattle.meta") };
}

const statusFilters = ["active", "sold", "dead", "archived", "all"] as const;

export default async function CattlePage({ searchParams }: PageProps<"/dashboard/cattle">) {
  const { supabase, farm, role } = await requireFarm();
  if (!farm.has_dairy) notFound();
  const i18n = await getI18n();
  const { t, e, o, options, locale } = i18n;
  const canWrite = role !== "vet";
  const { plan, usage, limits, states } = await getPlanContext();
  const atLimit = states.cattle === "full" || states.cattle === "over";

  const { status: rawStatus, q } = await searchParams;
  const status = statusFilters.find((s) => s === rawStatus) ?? "active";
  const search = typeof q === "string" ? q.trim() : "";

  let query = supabase
    .from("cattle")
    .select("*")
    .eq("farm_id", farm.id)
    .is("deleted_at", null)
    .order("tag_number");
  if (status !== "all") query = query.eq("status", status);
  if (search) {
    const term = search.replace(/[%,()"\\*]/g, "");
    query = query.or(`tag_number.ilike.%${term}%,name.ilike.%${term}%,breed.ilike.%${term}%`);
  }
  const [{ data, error }, mothersRes] = await Promise.all([
    query,
    // Every female on the farm can be picked as a mother (even if sold or dead).
    supabase
      .from("cattle")
      .select("id, tag_number, name, category, status")
      .eq("farm_id", farm.id)
      .eq("sex", "female")
      .is("deleted_at", null)
      .order("tag_number"),
  ]);
  if (error) throw new Error(error.message);
  const cattle = (data ?? []) as Cattle[];
  const mothers = (mothersRes.data ?? []) as MotherCandidate[];

  const age = (dob: string | null) => {
    const months = ageInMonths(dob);
    if (months === null) return t("age.unknown");
    if (months < 1) return t("age.lessThanMonth");
    if (months < 24) return t("age.months", { n: months });
    return t("age.yearsMonths", { y: Math.floor(months / 12), m: months % 12 });
  };

  return (
    <>
      <PageHeader title={t("cattle.title")} description={t("cattle.desc")} />

      <div className={`grid gap-6 ${canWrite ? "lg:grid-cols-[1fr_340px]" : ""}`}>
        <Card>
          <form className="mb-4 flex flex-wrap gap-2">
            <Input name="q" defaultValue={search} placeholder={t("cattle.searchPlaceholder")} className="max-w-xs" />
            <Select
              name="status"
              defaultValue={status}
              className="w-auto"
              options={statusFilters.map((s) => ({ value: s, label: s === "all" ? e("all") : o("cattle_status", s) }))}
            />
            <button className="rounded-lg border border-stone-300 px-3 text-sm hover:bg-stone-50">
              {t("common.filter")}
            </button>
          </form>

          {cattle.length === 0 ? (
            <EmptyState title={t("cattle.emptyTitle")}>{t("cattle.emptyBody")}</EmptyState>
          ) : (
            <Table
              head={[
                t("cattle.colTag"),
                t("cattle.colName"),
                t("cattle.colCategory"),
                t("cattle.colBreed"),
                t("cattle.colAge"),
                t("cattle.colStatus"),
              ]}
            >
              {cattle.map((c) => (
                <tr key={c.id} className="hover:bg-stone-50">
                  <Td>
                    <Link href={`/dashboard/cattle/${c.id}`} className="font-medium text-emerald-700 hover:underline">
                      {c.tag_number}
                    </Link>
                  </Td>
                  <Td>{c.name ?? "—"}</Td>
                  <Td>{o("cattle_category", c.category)}</Td>
                  <Td>{c.breed ? o("cattle_breed", c.breed) : "—"}</Td>
                  <Td>{age(c.date_of_birth)}</Td>
                  <Td>
                    <Badge tone={c.status === "active" ? "green" : c.status === "sold" ? "blue" : "red"}>
                      {o("cattle_status", c.status)}
                    </Badge>
                  </Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        {canWrite && (
        <Card title={t("cattle.addTitle")}>
          <LimitNotice
            t={t}
            kind="cattle"
            state={states.cattle}
            used={usage.cattle}
            max={limits.cattle}
            plan={planName(plan, locale)}
            canUpgrade={MANAGERS.includes(role)}
          />
          {!atLimit && (
          <ActionForm action={addCattle} submitLabel={t("cattle.addSubmit")}>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("cattle.tag")}>
                <Input name="tag_number" required />
              </Field>
              <Field label={t("common.name")}>
                <Input name="name" />
              </Field>
            </div>
            <Field label={t("common.category")} hint={typeSexHint(i18n)}>
              <Select name="category" required options={options("cattle_category")} />
            </Field>
            <Field label={t("common.breed")}>
              <Select name="breed" options={breedOptions(i18n, "cattle_breed")} />
            </Field>
            <Field label={t("cattle.dob")}>
              <Input name="date_of_birth" type="date" />
            </Field>
            <ParentsFields candidates={mothers} i18n={i18n} />
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("cattle.purchaseDate")}>
                <Input name="purchase_date" type="date" />
              </Field>
              <Field label={t("cattle.price", { cur: farm.currency })}>
                <Input name="purchase_price" type="number" min="0" step="0.01" />
              </Field>
            </div>
            <Field label={t("common.notes")}>
              <Textarea name="notes" rows={2} />
            </Field>
          </ActionForm>
          )}
        </Card>
        )}
      </div>
    </>
  );
}
