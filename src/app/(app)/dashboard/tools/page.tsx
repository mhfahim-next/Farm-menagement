import type { Metadata } from "next";
import { ToolGrid } from "@/components/tool-grid";
import { PageHeader } from "@/components/ui";
import { requireFarm } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("tools.title") };
}

export default async function DashboardToolsPage() {
  await requireFarm();
  const { t } = await getI18n();
  return (
    <>
      <PageHeader title={t("tools.title")} description={t("tools.desc")} />
      <ToolGrid base="/dashboard/tools" t={t} />
    </>
  );
}
