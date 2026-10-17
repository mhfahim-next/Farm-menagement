import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClickRow } from "@/components/click-row";
import { Badge, ButtonLink, Card, EmptyState, Input, PageHeader, Select, Table, Td } from "@/components/ui";
import { requireFarm } from "@/lib/auth";
import { ageInMonths } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import type { Cattle } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("cattle.meta") };
}

const statusFilters = ["active", "sold", "dead", "archived", "all"] as const;

export default async function CattlePage({ searchParams }: PageProps<"/dashboard/cattle">) {
  const { supabase, farm, role } = await requireFarm();
  if (!farm.has_dairy) notFound();
  const i18n = await getI18n();
  const { t, e, o } = i18n;
  const canWrite = role !== "vet";

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
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const cattle = (data ?? []) as Cattle[];

  const age = (dob: string | null) => {
    const months = ageInMonths(dob);
    if (months === null) return t("age.unknown");
    if (months < 1) return t("age.lessThanMonth");
    if (months < 24) return t("age.months", { n: months });
    return t("age.yearsMonths", { y: Math.floor(months / 12), m: months % 12 });
  };

  return (
    <>
      <PageHeader
        title={t("cattle.title")}
        description={t("cattle.desc")}
        action={canWrite ? <ButtonLink href="/dashboard/cattle/new">+ {t("cattle.addTitle")}</ButtonLink> : undefined}
      />

      <div>
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
                <ClickRow key={c.id} href={`/dashboard/cattle/${c.id}`}>
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
                </ClickRow>
              ))}
            </Table>
          )}
        </Card>

      </div>
    </>
  );
}
