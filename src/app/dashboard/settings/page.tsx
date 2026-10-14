import type { Metadata } from "next";
import { ActionForm } from "@/components/action-form";
import { Badge, Button, Card, Field, Input, PageHeader, Select, Table, Td } from "@/components/ui";
import { requireFarm } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { updateFarm } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("settings.meta") };
}

export default async function SettingsPage() {
  const { supabase, farm, role, user } = await requireFarm();
  const { t, e } = await getI18n();
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
      <PageHeader title={t("settings.title")} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={t("settings.farmTitle")}>
          <ActionForm action={updateFarm} submitLabel={t("settings.saveSettings")}>
            <fieldset disabled={!canEdit} className="grid gap-4 disabled:opacity-70">
              <Field label={t("settings.farmName")}>
                <Input name="name" defaultValue={farm.name} required />
              </Field>
              <Field label={t("common.location")}>
                <Input name="location" defaultValue={farm.location ?? ""} />
              </Field>
              <Field label={t("common.currency")}>
                <Select
                  name="currency"
                  defaultValue={farm.currency}
                  options={(["BDT", "INR", "PKR", "USD", "EUR"] as const).map((c) => ({ value: c, label: c }))}
                />
              </Field>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="has_dairy" defaultChecked={farm.has_dairy} className="accent-emerald-700" />
                  {t("settings.dairy")}
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="has_layer" defaultChecked={farm.has_layer} className="accent-emerald-700" />
                  {t("settings.layer")}
                </label>
              </div>
            </fieldset>
          </ActionForm>
        </Card>

        <div className="grid content-start gap-6">
          <Card title={t("settings.teamTitle")} description={t("settings.teamDesc")}>
            <Table head={[t("common.name"), t("common.role")]}>
              {(members ?? []).map((m) => (
                <tr key={m.user_id}>
                  <Td>
                    {names.get(m.user_id) ?? "—"}
                    {m.user_id === user.id && <span className="text-stone-500"> {t("common.you")}</span>}
                  </Td>
                  <Td>
                    <Badge tone={m.role === "owner" ? "green" : "default"}>{e(m.role)}</Badge>
                  </Td>
                </tr>
              ))}
            </Table>
          </Card>

          <Card title={t("settings.planTitle")}>
            <p className="text-sm text-stone-600">{t("settings.planText", { plan: e(farm.plan) })}</p>
          </Card>

          <Card title={t("settings.accountTitle")}>
            <p className="mb-3 text-sm text-stone-600">{t("settings.signedInAs", { email: user.email ?? "" })}</p>
            <form action="/auth/signout" method="post">
              <Button variant="secondary" type="submit">{t("menu.logout")}</Button>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
