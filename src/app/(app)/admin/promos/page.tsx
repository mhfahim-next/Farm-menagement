import type { Metadata } from "next";
import { ActionForm } from "@/components/action-form";
import { ConfirmForm } from "@/components/confirm-form";
import { PromoBox } from "@/components/promo-box";
import { Badge, Card, EmptyState, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { requireSuperAdmin } from "@/lib/auth";
import type { I18n } from "@/lib/i18n/core";
import { getI18n } from "@/lib/i18n/server";
import { PLACEMENTS, todayBd, type Promo } from "@/lib/promos";
import { deletePromo, savePromo, setPromoActive } from "./actions";
import { DateInput } from "@/components/date-input";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("promo.adminTitle") };
}

/** The day n days ago (YYYY-MM-DD). */
const daysAgo = (n: number) => new Date(Date.now() - n * 86400_000).toISOString().slice(0, 10);

type Row = Promo & { clicks: number; updated_at: string };
type Category = { slug: string; name_en: string; name_bn: string };
type Image = { path: string; alt_en: string | null };

function PromoForm({ p, categories, images, i18n }: { p?: Row; categories: Category[]; images: Image[]; i18n: I18n }) {
  const { t, locale } = i18n;
  return (
    <ActionForm action={savePromo} submitLabel={t("promo.save")}>
      {p && <input type="hidden" name="id" value={p.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("promo.kind")} hint={t("promo.kindHint")}>
          <Select
            name="kind"
            defaultValue={p?.kind ?? "house"}
            options={[
              { value: "house", label: t("promo.kind.house") },
              { value: "sponsor", label: t("promo.kind.sponsor") },
            ]}
          />
        </Field>
        <Field label={t("promo.sponsorName")} hint={t("promo.sponsorNameHint")}>
          <Input name="sponsor_name" maxLength={80} defaultValue={p?.sponsor_name ?? ""} />
        </Field>
        <Field label={t("promo.titleBn")}>
          <Input name="title_bn" required maxLength={120} defaultValue={p?.title_bn ?? ""} />
        </Field>
        <Field label={t("promo.titleEn")}>
          <Input name="title_en" required maxLength={120} defaultValue={p?.title_en ?? ""} />
        </Field>
        <Field label={t("promo.bodyBn")}>
          <Textarea name="body_bn" rows={2} maxLength={300} defaultValue={p?.body_bn ?? ""} />
        </Field>
        <Field label={t("promo.bodyEn")}>
          <Textarea name="body_en" rows={2} maxLength={300} defaultValue={p?.body_en ?? ""} />
        </Field>
        <Field label={t("promo.ctaBn")}>
          <Input name="cta_bn" required maxLength={40} defaultValue={p?.cta_bn ?? "বিনামূল্যে শুরু করুন"} />
        </Field>
        <Field label={t("promo.ctaEn")}>
          <Input name="cta_en" required maxLength={40} defaultValue={p?.cta_en ?? "Start free"} />
        </Field>
        <Field label={t("promo.url")} hint={t("promo.urlHint")}>
          <Input name="url" required maxLength={500} placeholder="/signup" defaultValue={p?.url ?? ""} />
        </Field>
        <Field label={t("promo.image")} hint={t("promo.imageHint")}>
          <Select
            name="image_path"
            defaultValue={p?.image_path ?? ""}
            options={[{ value: "", label: t("promo.noImage") }, ...images.map((i) => ({ value: i.path, label: i.alt_en ? `${i.path} (${i.alt_en})` : i.path }))]}
          />
        </Field>
        <Field label={t("promo.starts")} hint={t("promo.datesHint")}>
          <DateInput name="starts_on" defaultValue={p?.starts_on ?? ""} />
        </Field>
        <Field label={t("promo.ends")}>
          <DateInput name="ends_on" defaultValue={p?.ends_on ?? ""} />
        </Field>
        <Field label={t("promo.priority")} hint={t("promo.priorityHint")}>
          <Input name="priority" type="number" min={-100} max={100} step={1} defaultValue={p?.priority ?? 0} />
        </Field>
      </div>
      <fieldset>
        <legend className="text-sm font-medium text-stone-800">{t("promo.places")}</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {PLACEMENTS.map((x) => (
            <label key={x} className="flex items-start gap-2 text-sm">
              <input type="checkbox" name="placements" value={x} defaultChecked={p?.placements.includes(x)} className="mt-0.5 accent-emerald-700" />
              <span>
                {t(`promo.place.${x}`)}
                <span className="block text-xs text-stone-500">{t(`promo.placeHint.${x}`)}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-sm font-medium text-stone-800">{t("promo.categories")}</legend>
        <p className="text-xs text-stone-500">{t("promo.categoriesHint")}</p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
          {categories.map((c) => (
            <label key={c.slug} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="categories" value={c.slug} defaultChecked={p?.categories.includes(c.slug)} className="accent-emerald-700" />
              {locale === "bn" ? c.name_bn : c.name_en}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={p?.active ?? true} className="accent-emerald-700" />
        {t("promo.active")}
      </label>
    </ActionForm>
  );
}

export default async function AdminPromosPage() {
  const { supabase } = await requireSuperAdmin();
  const i18n = await getI18n();
  const { t, f, locale } = i18n;
  const since = daysAgo(30);
  const [{ data: promos }, { data: recent }, { data: cats }, { data: imgs }] = await Promise.all([
    supabase.from("promos").select("*").order("active", { ascending: false }).order("priority", { ascending: false }).order("created_at"),
    supabase.from("promo_clicks").select("promo_id, clicks").gte("day", since),
    supabase.from("blog_categories").select("slug, name_en, name_bn").order("sort_order"),
    supabase.from("blog_images").select("path, alt_en").order("created_at", { ascending: false }).limit(200),
  ]);
  const rows = (promos ?? []) as Row[];
  const categories = (cats ?? []) as Category[];
  const images = (imgs ?? []) as Image[];
  const last30 = new Map<string, number>();
  for (const r of (recent ?? []) as { promo_id: string; clicks: number }[]) last30.set(r.promo_id, (last30.get(r.promo_id) ?? 0) + r.clicks);
  const today = todayBd();
  const catName = new Map(categories.map((c) => [c.slug, locale === "bn" ? c.name_bn : c.name_en]));

  return (
    <>
      <PageHeader title={t("promo.adminTitle")} description={t("promo.adminDesc")} />
      <Card className="mb-6 border-amber-200 bg-amber-50 text-sm text-amber-950">
        <ul className="list-disc space-y-1 pl-5">
          <li>{t("promo.rule.health")}</li>
          <li>{t("promo.rule.label")}</li>
          <li>{t("promo.rule.clicks")}</li>
        </ul>
      </Card>

      <details className="mb-6 rounded-xl border border-stone-200 bg-white p-4 open:pb-6 dark:bg-stone-900">
        <summary className="cursor-pointer font-semibold text-emerald-800">+ {t("promo.new")}</summary>
        <div className="mt-4">
          <PromoForm categories={categories} images={images} i18n={i18n} />
        </div>
      </details>

      {rows.length === 0 ? (
        <Card>
          <EmptyState title={t("promo.empty")} />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {rows.map((p) => {
            const ended = !!p.ends_on && p.ends_on < today;
            const waiting = !!p.starts_on && p.starts_on > today;
            return (
              <Card key={p.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={p.kind === "sponsor" ? "amber" : "green"}>{t(`promo.kind.${p.kind}`)}</Badge>
                  <Badge tone={!p.active || ended ? "red" : waiting ? "amber" : "green"}>
                    {!p.active ? t("promo.off") : ended ? t("promo.ended") : waiting ? t("promo.waiting") : t("promo.on")}
                  </Badge>
                  <span className="ml-auto text-sm text-stone-600" data-testid="promo-clicks">
                    {t("promo.clicks", { all: f.number(p.clicks), recent: f.number(last30.get(p.id) ?? 0) })}
                  </span>
                </div>
                <div className="mt-3">
                  <PromoBox promo={p} locale={locale} t={t} />
                </div>
                <dl className="mt-3 grid gap-1 text-sm text-stone-600">
                  <div>
                    <dt className="inline font-medium text-stone-800">{t("promo.places")}: </dt>
                    <dd className="inline">{p.placements.map((x) => t(`promo.place.${x}`)).join(", ")}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-stone-800">{t("promo.categories")}: </dt>
                    <dd className="inline">{p.categories.length ? p.categories.map((c) => catName.get(c) ?? c).join(", ") : t("promo.allCategories")}</dd>
                  </div>
                  {(p.starts_on || p.ends_on) && (
                    <div>
                      <dt className="inline font-medium text-stone-800">{t("promo.dates")}: </dt>
                      <dd className="inline">
                        {p.starts_on ? f.date(p.starts_on) : "…"} – {p.ends_on ? f.date(p.ends_on) : "…"}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="inline font-medium text-stone-800">{t("promo.url")}: </dt>
                    <dd className="inline break-all">{p.url}</dd>
                  </div>
                </dl>
                <div className="mt-4 flex flex-wrap gap-2">
                  <ConfirmForm
                    action={setPromoActive}
                    fields={{ id: p.id, active: p.active ? "0" : "1" }}
                    label={p.active ? t("promo.turnOff") : t("promo.turnOn")}
                    variant={p.active ? "secondary" : "primary"}
                  />
                  <ConfirmForm action={deletePromo} fields={{ id: p.id }} label={t("common.delete")} variant="danger" confirm={t("promo.confirmDelete")} />
                </div>
                <details className="mt-4 border-t border-stone-200 pt-3">
                  <summary className="cursor-pointer text-sm font-semibold text-emerald-800">{t("promo.edit")}</summary>
                  <div className="mt-4">
                    <PromoForm p={p} categories={categories} images={images} i18n={i18n} />
                  </div>
                </details>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
