import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { CommunityImagePicker } from "@/components/community/image-picker";
import { PublicFooter, PublicHeader } from "@/components/public-header";
import { Card, Field, Input, Select, Textarea } from "@/components/ui";
import { getUser } from "@/lib/auth";
import { getTopics } from "@/lib/community-data";
import { getI18n } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { askQuestion } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("community.ask"), robots: { index: false, follow: true } };
}

export default async function AskPage({ searchParams }: PageProps<"/community/ask">) {
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/community/ask")}`);
  const { t, locale } = await getI18n();
  const { topic } = await searchParams;
  const supabase = await createClient();
  const [topics, { data: canPost }, { data: settings }] = await Promise.all([
    getTopics(),
    supabase.rpc("community_can_post"),
    supabase.from("system_settings").select("community_premoderation").eq("id", 1).maybeSingle(),
  ]);
  const preset = typeof topic === "string" ? topics.find((x) => x.slug === topic)?.id : undefined;

  return (
    <div className="flex flex-1 flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:py-12">
        <Link href="/community" className="text-sm text-stone-600 hover:text-stone-900">← {t("community.title")}</Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">{t("community.ask")}</h1>
        <p className="mt-1 text-stone-600">{t("community.askIntro")}</p>

        {!canPost ? (
          <p role="alert" className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{t("community.errBanned")}</p>
        ) : (
          <Card className="mt-6">
            {settings?.community_premoderation && (
              <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{t("community.premodNotice")}</p>
            )}
            <ActionForm action={askQuestion} submitLabel={t("community.post")}>
              <Field label={t("community.fieldTitle")} hint={t("community.titleHint")}>
                <Input name="title" required minLength={10} maxLength={200} placeholder={t("community.titlePlaceholder")} />
              </Field>
              <Field label={t("community.fieldTopic")}>
                <Select
                  name="topic_id"
                  defaultValue={preset ?? ""}
                  options={[{ value: "", label: t("community.pickTopic") }, ...topics.map((x) => ({ value: x.id, label: locale === "bn" ? x.name_bn : x.name_en }))]}
                />
              </Field>
              <Field label={t("community.fieldBody")} hint={t("community.bodyHint")}>
                <Textarea name="body" rows={8} required minLength={10} maxLength={10000} />
              </Field>
              <div>
                <p className="mb-1.5 text-sm font-medium text-stone-700">{t("community.photos")}</p>
                <CommunityImagePicker userId={user.id} />
              </div>
              <p className="text-xs text-stone-500">{t("community.rulesBody")}</p>
            </ActionForm>
          </Card>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
