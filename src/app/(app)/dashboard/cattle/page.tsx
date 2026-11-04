import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AnimalList } from "@/components/animal-list";
import { requireFarm } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { keepsAnimals, keepsCattle } from "@/lib/modules";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("cattle.meta") };
}

export default async function CattlePage({ searchParams }: PageProps<"/dashboard/cattle">) {
  const { farm } = await requireFarm();
  if (!keepsAnimals(farm)) notFound();
  // A goat-only farm has no cattle list.
  if (!keepsCattle(farm)) redirect("/dashboard/goats");
  return <AnimalList group="cattle" searchParams={await searchParams} />;
}
