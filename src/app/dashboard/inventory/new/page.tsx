import type { Metadata } from "next";
import { ActionForm } from "@/components/action-form";
import { StockItemFields } from "@/components/stock-item-fields";
import { ButtonLink, Card, PageHeader } from "@/components/ui";
import { requireRole, STAFF } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { createItem } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("stock.newItem") };
}

export default async function NewStockItemPage() {
  const { farm } = await requireRole(STAFF);
  const i18n = await getI18n();
  const { t, options } = i18n;
  const modules = options("txn_module").filter(
    (m) => (m.value !== "dairy" || farm.has_dairy) && (m.value !== "layer" || farm.has_layer),
  );
  return (
    <>
      <PageHeader
        title={t("stock.newItem")}
        description={t("stock.newItemDesc")}
        action={<ButtonLink href="/dashboard/inventory" variant="secondary">{t("common.back")}</ButtonLink>}
      />
      <Card className="max-w-xl">
        <ActionForm action={createItem} submitLabel={t("common.save")} successHref="/dashboard/inventory">
          <StockItemFields i18n={i18n} modules={modules} />
        </ActionForm>
      </Card>
    </>
  );
}
