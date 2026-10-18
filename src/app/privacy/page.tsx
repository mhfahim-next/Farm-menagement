import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("legal.privacy"), alternates: { canonical: "/privacy" } };
}

export default function Page() {
  return <LegalPage slug="privacy" />;
}
