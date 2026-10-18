import type { Metadata } from "next";
import { ActionForm } from "@/components/action-form";
import { BuyerFields } from "@/components/buyer-fields";
import { ButtonLink, Card, PageHeader } from "@/components/ui";
import { requireRole, STAFF } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { createBuyer } from "../../actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("sales.newBuyer") };
}

export default async function NewBuyerPage({ searchParams }: PageProps<"/dashboard/sales/buyers/new">) {
  const { farm } = await requireRole(STAFF);
  const i18n = await getI18n();
  const { t } = i18n;
  const { back } = await searchParams;
  return (
    <>
      <PageHeader
        title={t("sales.newBuyer")}
        description={t("sales.newBuyerDesc")}
        action={<ButtonLink href={back === "sale" ? "/dashboard/sales/new" : "/dashboard/sales"} variant="secondary">{t("common.back")}</ButtonLink>}
      />
      <Card className="max-w-xl">
        <ActionForm action={createBuyer} submitLabel={t("common.save")}>
          {back === "sale" && <input type="hidden" name="back" value="sale" />}
          <BuyerFields i18n={i18n} currency={farm.currency} dairy={farm.has_dairy} layer={farm.has_layer} />
        </ActionForm>
      </Card>
    </>
  );
}
