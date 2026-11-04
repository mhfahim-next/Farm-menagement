import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AnimalList } from "@/components/animal-list";
import { requireFarm } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("goats.title") };
}

export default async function GoatsPage({ searchParams }: PageProps<"/dashboard/goats">) {
  const { farm } = await requireFarm();
  if (!farm.has_goat) notFound();
  return <AnimalList group="small" searchParams={await searchParams} />;
}
