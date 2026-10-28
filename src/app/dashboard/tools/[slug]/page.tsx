import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { addWeight } from "@/app/dashboard/cattle/actions";
import { FarmTool } from "@/components/farm-tools";
import { Card, PageHeader } from "@/components/ui";
import { requireFarm, STAFF } from "@/lib/auth";
import { today } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { toolBySlug, toolName, toolShort } from "@/lib/tool-list";

export async function generateMetadata({ params }: PageProps<"/dashboard/tools/[slug]">): Promise<Metadata> {
  const tool = toolBySlug((await params).slug);
  const { t } = await getI18n();
  return { title: tool ? t(toolName(tool.key)) : t("tools.title") };
}

/** A tool inside the dashboard; the tape weight can be saved straight to one of the farm's animals. */
export default async function DashboardToolPage({ params }: PageProps<"/dashboard/tools/[slug]">) {
  const tool = toolBySlug((await params).slug);
  if (!tool) notFound();
  const { supabase, farm, role } = await requireFarm();
  const { t } = await getI18n();
  let animals: { id: string; label: string }[] | undefined;
  if (tool.slug === "cattle-weight" && STAFF.includes(role)) {
    const { data } = await supabase.from("cattle").select("id, tag_number, name").eq("farm_id", farm.id).eq("status", "active").is("deleted_at", null).order("tag_number").limit(1000);
    animals = (data ?? []).map((a) => ({ id: a.id as string, label: `#${a.tag_number}${a.name ? ` · ${a.name}` : ""}` }));
  }
  return (
    <>
      <Link href="/dashboard/tools" className="mb-3 inline-block text-sm font-medium text-emerald-700 hover:underline">
        ← {t("tools.all")}
      </Link>
      <PageHeader title={`${tool.icon} ${t(toolName(tool.key))}`} description={t(toolShort(tool.key))} />
      <Card className="max-w-3xl">
        <FarmTool slug={tool.slug} today={today()} animals={animals} saveWeight={animals ? addWeight : undefined} />
      </Card>
    </>
  );
}
