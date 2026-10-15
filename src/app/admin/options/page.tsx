import type { Metadata } from "next";
import Link from "next/link";
import { Badge, PageHeader } from "@/components/ui";
import { requireSuperAdmin } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import type { ListInfo } from "@/lib/options";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("options.meta") };
}

export default async function AdminOptionsPage() {
  const { supabase } = await requireSuperAdmin();
  const { t, rows, options } = await getI18n();

  const { data } = await supabase.from("dropdown_lists").select("key, editable, sort_order").order("sort_order");
  const lists = (data ?? []) as ListInfo[];

  return (
    <>
      <PageHeader title={t("options.title")} description={t("options.desc")} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lists.map((l) => {
          const all = rows(l.key);
          const preview = options(l.key).slice(0, 4).map((x) => x.label).join(", ");
          return (
            <Link
              key={l.key}
              href={`/admin/options/${l.key}`}
              className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition-colors hover:border-emerald-600"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-stone-900">{t(`options.list.${l.key}`)}</h2>
                <Badge tone={l.editable ? "green" : "default"}>{l.editable ? t("options.editable") : t("options.fixed")}</Badge>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-stone-600">{preview || "—"}</p>
              <p className="mt-3 text-xs text-stone-500">
                {t("options.count", { active: all.filter((x) => x.active).length, total: all.length })}
              </p>
            </Link>
          );
        })}
      </div>
    </>
  );
}
