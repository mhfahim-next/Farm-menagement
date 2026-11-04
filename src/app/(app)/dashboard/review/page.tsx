import type { Metadata } from "next";
import { ActionForm } from "@/components/action-form";
import { StarInput } from "@/components/star-input";
import { Badge, Card, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { getProfile, requireFarm } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { saveReview } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("review.title") };
}

export default async function ReviewPage() {
  const { supabase, user, farm } = await requireFarm();
  const { t } = await getI18n();
  const profile = await getProfile();
  const { data: mine } = await supabase
    .from("reviews")
    .select("name, role, rating, body, status")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <>
      <PageHeader title={t("review.title")} description={t("review.desc")} />
      <Card className="max-w-2xl">
        {mine && (
          <p className="mb-5 flex flex-wrap items-center gap-2 text-sm text-stone-600">
            {t("review.yourStatus")}
            <Badge tone={mine.status === "approved" ? "green" : mine.status === "rejected" ? "red" : "amber"}>
              {t(`review.status.${mine.status as "pending" | "approved" | "rejected"}`)}
            </Badge>
          </p>
        )}
        <ActionForm action={saveReview} submitLabel={mine ? t("review.update") : t("review.submit")}>
          {/* Not a <Field>: that is a <label>, and the stars are labels themselves. */}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-stone-700">{t("review.rating")}</span>
            <StarInput name="rating" defaultValue={mine?.rating ?? 5} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("review.name")}>
              <Input name="name" required maxLength={80} defaultValue={mine?.name ?? profile?.full_name ?? ""} />
            </Field>
            <Field label={t("review.role")} hint={t("review.roleHint")}>
              <Input name="role" maxLength={120} defaultValue={mine?.role ?? farm.name} />
            </Field>
          </div>
          <Field label={t("review.body")} hint={t("review.bodyHint")}>
            <Textarea name="body" rows={5} required minLength={10} maxLength={600} defaultValue={mine?.body ?? ""} />
          </Field>
          <p className="text-xs text-stone-500">{t("review.moderation")}</p>
        </ActionForm>
      </Card>
    </>
  );
}
