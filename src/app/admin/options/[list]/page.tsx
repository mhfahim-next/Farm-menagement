import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { OptionFields } from "@/components/option-fields";
import { Badge, Card, Field, Input, PageHeader } from "@/components/ui";
import { requireSuperAdmin } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { isListKey } from "@/lib/options";
import { addOption, saveOption } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("options.meta") };
}

export default async function AdminOptionListPage({ params }: PageProps<"/admin/options/[list]">) {
  const { list } = await params;
  if (!isListKey(list)) notFound();
  const { supabase } = await requireSuperAdmin();
  const i18n = await getI18n();
  const { t, rows } = i18n;

  const { data: info } = await supabase.from("dropdown_lists").select("editable").eq("key", list).maybeSingle();
  if (!info) notFound();
  const items = rows(list);

  return (
    <>
      <PageHeader
        title={t(`options.list.${list}`)}
        description={info.editable ? t("options.editableHint") : t("options.fixedHint")}
        action={
          <Link href="/admin/options" className="text-sm text-stone-500 hover:text-stone-900">
            {t("options.back")}
          </Link>
        }
      />

      <div className="grid gap-4">
        {items.map((item) => (
          <Card key={item.value} className={item.active ? "" : "opacity-75"}>
            <ActionForm action={saveOption} submitLabel={t("options.save")} submitVariant="secondary" className="grid gap-3">
              <input type="hidden" name="list_key" value={list} />
              <input type="hidden" name="value" value={item.value} />
              <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                <span>
                  {t("options.code")}: <code className="rounded bg-stone-100 px-1.5 py-0.5 text-stone-700">{item.value}</code>
                </span>
                {!item.can_hide && <Badge tone="blue">{t("options.required")}</Badge>}
                {!item.active && <Badge tone="amber">{t("options.hidden")}</Badge>}
              </div>
              <OptionFields list={list} i18n={i18n} defaults={item} />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={item.active}
                  disabled={!item.can_hide}
                  className="accent-emerald-700"
                />
                {t("options.visible")}
                {/* A disabled checkbox isn't submitted; required options always stay visible. */}
                {!item.can_hide && <input type="hidden" name="active" value="on" />}
              </label>
            </ActionForm>
          </Card>
        ))}

        {info.editable && (
          <Card title={t("options.addTitle")} className="border-dashed">
            <ActionForm action={addOption} submitLabel={t("options.addSubmit")} className="grid gap-3">
              <input type="hidden" name="list_key" value={list} />
              <Field
                label={t("options.code")}
                hint={list === "currency" ? t("options.codeCurrencyHint") : t("options.codeHint")}
              >
                <Input
                  name="value"
                  maxLength={list === "currency" ? 3 : 50}
                  required={list === "currency"}
                  className="max-w-56"
                />
              </Field>
              <OptionFields list={list} i18n={i18n} />
            </ActionForm>
          </Card>
        )}
      </div>
    </>
  );
}
