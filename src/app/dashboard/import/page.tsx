import type { Metadata } from "next";
import { ImportWizard } from "@/components/import-wizard";
import { PageHeader } from "@/components/ui";
import { MANAGERS, requireRole } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import type { ImportKind } from "@/lib/import";
import { keepsAnimals, keepsPoultry } from "@/lib/modules";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("import.title") };
}

export default async function ImportPage() {
  const { farm } = await requireRole(MANAGERS);
  const { t } = await getI18n();
  const kinds: ImportKind[] = [
    ...(keepsAnimals(farm) ? (["cattle"] as const) : []),
    ...(farm.has_dairy ? (["milk"] as const) : []),
    ...(keepsPoultry(farm) ? (["flock"] as const) : []),
    "finance",
  ];
  return (
    <>
      <PageHeader title={t("import.title")} description={t("import.desc")} />
      <ImportWizard kinds={kinds} />
    </>
  );
}
