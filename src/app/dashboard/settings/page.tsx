import type { Metadata } from "next";
import { ActionForm } from "@/components/action-form";
import { Badge, Button, Card, Field, Input, PageHeader, Select, Table, Td } from "@/components/ui";
import { requireFarm } from "@/lib/auth";
import { label } from "@/lib/format";
import { updateFarm } from "./actions";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { supabase, farm, role, user } = await requireFarm();
  const canEdit = role === "owner" || role === "manager";

  const { data: members } = await supabase
    .from("farm_members")
    .select("user_id, role, created_at")
    .eq("farm_id", farm.id)
    .order("created_at");
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", (members ?? []).map((m) => m.user_id));
  const names = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  return (
    <>
      <PageHeader title="Settings" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Farm">
          <ActionForm action={updateFarm} submitLabel="Save settings">
            <fieldset disabled={!canEdit} className="grid gap-4 disabled:opacity-70">
              <Field label="Farm name">
                <Input name="name" defaultValue={farm.name} required />
              </Field>
              <Field label="Location">
                <Input name="location" defaultValue={farm.location ?? ""} />
              </Field>
              <Field label="Currency">
                <Select
                  name="currency"
                  defaultValue={farm.currency}
                  options={["BDT", "INR", "PKR", "USD", "EUR"].map((c) => ({ value: c, label: c }))}
                />
              </Field>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="has_dairy" defaultChecked={farm.has_dairy} className="accent-emerald-700" />
                  Cattle & dairy
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="has_layer" defaultChecked={farm.has_layer} className="accent-emerald-700" />
                  Layer chickens
                </label>
              </div>
            </fieldset>
          </ActionForm>
        </Card>

        <div className="grid content-start gap-6">
          <Card title="Team" description="Inviting team members is coming soon.">
            <Table head={["Name", "Role"]}>
              {(members ?? []).map((m) => (
                <tr key={m.user_id}>
                  <Td>
                    {names.get(m.user_id) ?? "—"}
                    {m.user_id === user.id && <span className="text-stone-500"> (you)</span>}
                  </Td>
                  <Td>
                    <Badge tone={m.role === "owner" ? "green" : "default"}>{label(m.role)}</Badge>
                  </Td>
                </tr>
              ))}
            </Table>
          </Card>

          <Card title="Plan">
            <p className="text-sm text-stone-600">
              You are on the <strong>{label(farm.plan)}</strong> plan.
            </p>
          </Card>

          <Card title="Account">
            <p className="mb-3 text-sm text-stone-600">Signed in as {user.email}</p>
            <form action="/auth/signout" method="post">
              <Button variant="secondary" type="submit">Sign out</Button>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
