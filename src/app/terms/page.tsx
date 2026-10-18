import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { getI18n } from "@/lib/i18n/server";
import { langAlternates } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getI18n();
  return { title: t("legal.terms"), alternates: langAlternates("/terms", locale) };
}

export default function Page() {
  return <LegalPage slug="terms" />;
}
