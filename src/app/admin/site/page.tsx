import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { Card, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { requireSuperAdmin } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import type { SiteInfo, SitePage } from "@/lib/public-data";
import { saveSiteInfo, saveSitePage } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("site.title") };
}

export default async function AdminSitePage() {
  const { supabase } = await requireSuperAdmin();
  const { t } = await getI18n();
  const [pagesRes, infoRes] = await Promise.all([
    supabase.from("site_pages").select("*").order("slug", { ascending: false }),
    supabase.from("site_info").select("*").eq("id", 1).maybeSingle(),
  ]);
  const pages = (pagesRes.data ?? []) as SitePage[];
  const info = infoRes.data as SiteInfo | null;

  return (
    <>
      <PageHeader title={t("site.title")} description={t("site.desc")} />

      <Card title={t("site.contactTitle")} description={t("site.contactDesc")} className="max-w-3xl">
        <ActionForm action={saveSiteInfo} submitLabel={t("common.save")}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label={t("contact.email")}>
              <Input name="contact_email" type="email" defaultValue={info?.contact_email ?? ""} />
            </Field>
            <Field label={t("contact.phone")}>
              <Input name="contact_phone" defaultValue={info?.contact_phone ?? ""} />
            </Field>
            <Field label="WhatsApp">
              <Input name="whatsapp" defaultValue={info?.whatsapp ?? ""} placeholder="+8801…" />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("site.addressEn")}>
              <Input name="address_en" defaultValue={info?.address_en ?? ""} />
            </Field>
            <Field label={t("site.addressBn")}>
              <Input name="address_bn" defaultValue={info?.address_bn ?? ""} />
            </Field>
            <Field label={t("site.hoursEn")}>
              <Input name="office_hours_en" defaultValue={info?.office_hours_en ?? ""} />
            </Field>
            <Field label={t("site.hoursBn")}>
              <Input name="office_hours_bn" defaultValue={info?.office_hours_bn ?? ""} />
            </Field>
          </div>
          <p className="text-xs text-stone-500">{t("site.emptyHidden")}</p>
        </ActionForm>
      </Card>

      {pages.map((p) => (
        <Card
          key={p.slug}
          className="mt-6 max-w-5xl"
          title={t(`legal.${p.slug}`)}
          action={
            <Link href={`/${p.slug}`} target="_blank" className="text-sm text-emerald-700 hover:underline">
              {t("site.view")} ↗
            </Link>
          }
        >
          <ActionForm action={saveSitePage} submitLabel={t("site.savePage")}>
            <input type="hidden" name="slug" value={p.slug} />
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="grid content-start gap-3">
                <Field label={t("site.titleEn")}>
                  <Input name="title_en" defaultValue={p.title_en} required />
                </Field>
                <Field label={t("site.bodyEn")} hint={t("site.markdownHint")}>
                  <Textarea name="body_en" rows={18} defaultValue={p.body_en} className="font-mono text-xs" required />
                </Field>
              </div>
              <div className="grid content-start gap-3">
                <Field label={t("site.titleBn")}>
                  <Input name="title_bn" defaultValue={p.title_bn} required />
                </Field>
                <Field label={t("site.bodyBn")} hint={t("site.markdownHint")}>
                  <Textarea name="body_bn" rows={18} defaultValue={p.body_bn} className="font-mono text-xs" required />
                </Field>
              </div>
            </div>
            <p className="text-xs text-stone-500">{t("site.legalNote")}</p>
          </ActionForm>
        </Card>
      ))}
    </>
  );
}
