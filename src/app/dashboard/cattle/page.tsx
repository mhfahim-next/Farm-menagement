import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { Badge, Card, EmptyState, Field, Input, PageHeader, Select, Table, Td, Textarea } from "@/components/ui";
import { requireFarm } from "@/lib/auth";
import { ageFrom, label } from "@/lib/format";
import type { Cattle } from "@/lib/types";
import { addCattle } from "./actions";
import { categoryOptions, sexOptions } from "./options";

export const metadata: Metadata = { title: "Cattle" };

const statusFilters = ["active", "sold", "dead", "all"] as const;

export default async function CattlePage({ searchParams }: PageProps<"/dashboard/cattle">) {
  const { supabase, farm } = await requireFarm();
  if (!farm.has_dairy) notFound();

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

  return (
    <>
      <PageHeader title="Cattle" description="Your herd register." />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card>
          <form className="mb-4 flex flex-wrap gap-2">
            <Input name="q" defaultValue={search} placeholder="Search tag, name or breed" className="max-w-xs" />
            <Select
              name="status"
              defaultValue={status}
              className="w-auto"
              options={statusFilters.map((s) => ({ value: s, label: label(s) }))}
            />
            <button className="rounded-lg border border-stone-300 px-3 text-sm hover:bg-stone-50">
              Filter
            </button>
          </form>

          {cattle.length === 0 ? (
            <EmptyState title="No animals found">Add one with the form.</EmptyState>
          ) : (
            <Table head={["Tag", "Name", "Category", "Breed", "Age", "Status"]}>
              {cattle.map((c) => (
                <tr key={c.id} className="hover:bg-stone-50">
                  <Td>
                    <Link href={`/dashboard/cattle/${c.id}`} className="font-medium text-emerald-700 hover:underline">
                      {c.tag_number}
                    </Link>
                  </Td>
                  <Td>{c.name ?? "—"}</Td>
                  <Td>{label(c.category)}</Td>
                  <Td>{c.breed ?? "—"}</Td>
                  <Td>{ageFrom(c.date_of_birth)}</Td>
                  <Td>
                    <Badge tone={c.status === "active" ? "green" : c.status === "sold" ? "blue" : "red"}>
                      {label(c.status)}
                    </Badge>
                  </Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card title="Add animal">
          <ActionForm action={addCattle} submitLabel="Add animal">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tag number">
                <Input name="tag_number" required />
              </Field>
              <Field label="Name">
                <Input name="name" />
              </Field>
              <Field label="Category">
                <Select name="category" options={categoryOptions} />
              </Field>
              <Field label="Sex">
                <Select name="sex" options={sexOptions} />
              </Field>
            </div>
            <Field label="Breed">
              <Input name="breed" placeholder="e.g. Holstein Friesian, Sahiwal" />
            </Field>
            <Field label="Date of birth">
              <Input name="date_of_birth" type="date" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Purchase date">
                <Input name="purchase_date" type="date" />
              </Field>
              <Field label={`Price (${farm.currency})`}>
                <Input name="purchase_price" type="number" min="0" step="0.01" />
              </Field>
            </div>
            <Field label="Notes">
              <Textarea name="notes" rows={2} />
            </Field>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
