import Link from "next/link";
import { ClickRow } from "@/components/click-row";
import { Badge, ButtonLink, Card, EmptyState, Input, PageHeader, Select, Table, Td } from "@/components/ui";
import { requireFarm } from "@/lib/auth";
import { GROUP_SPECIES, type AnimalGroup } from "@/lib/cattle";
import { ageInMonths } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import type { Cattle } from "@/lib/types";

const statusFilters = ["active", "sold", "dead", "archived", "all"] as const;

/** The animal register for cattle, or for goats and sheep together. */
export async function AnimalList({ group, searchParams }: { group: AnimalGroup; searchParams: Record<string, string | string[] | undefined> }) {
  const { supabase, farm, role } = await requireFarm();
  const i18n = await getI18n();
  const { t, e, o } = i18n;
  const canWrite = role !== "vet";
  const small = group === "small";
  const newHref = small ? "/dashboard/cattle/new?species=goat" : "/dashboard/cattle/new";

  const { status: rawStatus, q } = searchParams;
  const status = statusFilters.find((s) => s === rawStatus) ?? "active";
  const search = typeof q === "string" ? q.trim() : "";

  let query = supabase
    .from("cattle")
    .select("*")
    .eq("farm_id", farm.id)
    .in("species", GROUP_SPECIES[group])
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
  const { data: latest } = cattle.length
    ? await supabase.from("cattle_latest_weight").select("cattle_id, weight_kg").eq("farm_id", farm.id)
    : { data: [] };
  const weightOf = new Map((latest ?? []).map((w) => [w.cattle_id as string, Number(w.weight_kg)]));

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
        title={small ? t("goats.title") : t("cattle.title")}
        description={small ? t("goats.desc") : t("cattle.desc")}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {canWrite && cattle.length > 0 && (
              <ButtonLink href={small ? "/dashboard/cattle/tags?group=small" : "/dashboard/cattle/tags"} variant="secondary" data-testid="tags-link">
                🖨 {t("print.tagsButton")}
              </ButtonLink>
            )}
            {canWrite && <ButtonLink href={newHref}>+ {small ? t("goats.addTitle") : t("cattle.addTitle")}</ButtonLink>}
          </div>
        }
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
            <EmptyState title={small ? t("goats.emptyTitle") : t("cattle.emptyTitle")}>{small ? t("goats.emptyBody") : t("cattle.emptyBody")}</EmptyState>
          ) : (
            <Table
              head={[
                t("cattle.colTag"),
                t("cattle.colName"),
                t("cattle.colCategory"),
                t("cattle.colBreed"),
                t("cattle.colAge"),
                t("weight.current"),
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
                  <Td>
                    {o("cattle_category", c.category)}
                    {c.is_fattening && <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-800">{t("fatten.badge")}</span>}
                  </Td>
                  <Td>{c.breed ? o("cattle_breed", c.breed) : "—"}</Td>
                  <Td>{age(c.date_of_birth)}</Td>
                  <Td className="tabular-nums">{weightOf.has(c.id) ? t("weight.kgShort", { n: i18n.f.number(weightOf.get(c.id)!, 1) }) : "—"}</Td>
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
