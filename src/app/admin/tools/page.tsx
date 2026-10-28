import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { ConfirmForm } from "@/components/confirm-form";
import { Badge, Card, Field, Input, PageHeader } from "@/components/ui";
import { requireSuperAdmin } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { fieldLabel, GROUP_TOOL, showValue, specFor } from "@/lib/tool-admin";
import { mergeToolParams, TOOL_PARAM_GROUPS } from "@/lib/tools";
import { resetAllToolParams, resetToolParams, saveToolParams } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("tadm.title") };
}

/** The numbers behind the free farm tools: a box per number, empty = the built-in default. */
export default async function AdminToolsPage() {
  const { supabase } = await requireSuperAdmin();
  const { t, f } = await getI18n();
  const { data } = await supabase.from("tool_settings").select("tool, params, updated_at");
  const rows = (data ?? []) as { tool: string; params: unknown; updated_at: string }[];
  const { params, custom } = mergeToolParams(rows);
  const anyCustom = Object.keys(custom).length > 0;

  return (
    <>
      <PageHeader
        title={t("tadm.title")}
        description={t("tadm.desc")}
        action={
          anyCustom ? (
            <ConfirmForm action={resetAllToolParams} fields={{}} confirm={t("tadm.resetAllConfirm")} label={t("tadm.resetAll")} />
          ) : (
            <Badge>{t("tadm.allDefault")}</Badge>
          )
        }
      />
      <div className="grid gap-6 xl:grid-cols-2">
        {TOOL_PARAM_GROUPS.map((group) => {
          const changed = custom[group] ?? [];
          const row = rows.find((r) => r.tool === group);
          const values = params[group] as Record<string, number | number[]>;
          return (
            <Card
              key={group}
              title={t(`tadm.g.${group}`)}
              description={changed.length && row ? t("tadm.updated", { when: f.dateTime(row.updated_at) }) : undefined}
              action={
                <span className="flex items-center gap-2">
                  {changed.length > 0 && <Badge tone="amber">{t("tadm.custom")}</Badge>}
                  <Link href={`/tools/${GROUP_TOOL[group]}`} target="_blank" className="text-sm text-emerald-700 hover:underline">
                    {t("tadm.try")} ↗
                  </Link>
                </span>
              }
            >
              <div data-testid={`tadm-${group}`}>
                <ActionForm action={saveToolParams} submitLabel={t("tadm.save")} className="grid gap-3">
                  <input type="hidden" name="group" value={group} />
                  {/* Re-created after each save or reset, so the boxes show what is stored now. */}
                  <div key={row?.updated_at ?? "default"} className={`grid gap-3 ${group === "poultry" ? "" : "sm:grid-cols-2"}`}>
                    {Object.entries(specFor(group)).map(([key, spec]) => {
                      const isList = typeof spec.def !== "number";
                      const isChanged = changed.includes(key);
                      return (
                        <Field
                          key={key}
                          label={fieldLabel(t, group, key)}
                          hint={`${t("tadm.default", { value: showValue(spec.def) })}${isList ? ` · ${t("tadm.listHint")}` : ""}`}
                        >
                          <Input
                            name={key}
                            inputMode={isList ? "text" : "decimal"}
                            defaultValue={isChanged ? showValue(values[key]) : ""}
                            placeholder={showValue(spec.def)}
                            className={isChanged ? "border-amber-400 bg-amber-50" : undefined}
                            data-testid={`tadm-${group}-${key}`}
                          />
                        </Field>
                      );
                    })}
                  </div>
                </ActionForm>
                {changed.length > 0 && (
                  <div className="mt-3 border-t border-stone-100 pt-3">
                    <ConfirmForm action={resetToolParams} fields={{ group }} confirm={t("tadm.resetConfirm")} label={t("tadm.reset")} />
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
