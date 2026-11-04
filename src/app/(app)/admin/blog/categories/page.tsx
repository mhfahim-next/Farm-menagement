import type { Metadata } from "next";
import { ActionForm } from "@/components/action-form";
import { ConfirmForm } from "@/components/confirm-form";
import { Card, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { requireSuperAdmin } from "@/lib/auth";
import type { BlogCategory, BlogTag } from "@/lib/blog";
import { getI18n } from "@/lib/i18n/server";
import { deleteBlogCategory, deleteBlogTag, saveBlogCategory, saveBlogTag } from "../actions";
import { BlogAdminTabs } from "../tabs";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("admin.blog.tabCategories") };
}

export default async function BlogCategoriesPage() {
  const { supabase } = await requireSuperAdmin();
  const { t } = await getI18n();
  const [{ data: cats }, { data: tagRows }, { data: posts }, { data: links }] = await Promise.all([
    supabase.from("blog_categories").select("*").order("sort_order"),
    supabase.from("blog_tags").select("*").order("name_en"),
    supabase.from("blog_posts").select("category_id"),
    supabase.from("blog_post_tags").select("tag_id"),
  ]);
  const categories = (cats ?? []) as BlogCategory[];
  const tags = (tagRows ?? []) as BlogTag[];
  const catCount = (id: string) => (posts ?? []).filter((p) => p.category_id === id).length;
  const tagCount = (id: string) => (links ?? []).filter((l) => l.tag_id === id).length;

  const categoryFields = (c?: BlogCategory) => (
    <>
      {c && <input type="hidden" name="id" value={c.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("admin.blog.nameBn")}>
          <Input name="name_bn" defaultValue={c?.name_bn ?? ""} required maxLength={60} />
        </Field>
        <Field label={t("admin.blog.nameEn")}>
          <Input name="name_en" defaultValue={c?.name_en ?? ""} required maxLength={60} />
        </Field>
        <Field label={t("admin.blog.descBn")}>
          <Textarea name="description_bn" rows={2} defaultValue={c?.description_bn ?? ""} maxLength={300} />
        </Field>
        <Field label={t("admin.blog.descEn")}>
          <Textarea name="description_en" rows={2} defaultValue={c?.description_en ?? ""} maxLength={300} />
        </Field>
        <Field label={t("admin.blog.slug")}>
          <Input name="slug" defaultValue={c?.slug ?? ""} maxLength={60} pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="cattle-health" />
        </Field>
        <Field label={t("admin.blog.sortOrder")}>
          <Input name="sort_order" type="number" defaultValue={c?.sort_order ?? 0} />
        </Field>
      </div>
    </>
  );

  return (
    <>
      <PageHeader title={t("admin.blog.title")} description={t("admin.blog.taxDesc")} />
      <BlogAdminTabs active="categories" />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="grid content-start gap-4">
          <h2 className="text-lg font-semibold text-stone-900">{t("admin.blog.categories")}</h2>
          {categories.map((c) => (
            <Card key={c.id}>
              <details>
                <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
                  <span>
                    <span className="font-semibold text-stone-900">{c.name_bn}</span>
                    <span className="text-stone-500"> · {c.name_en}</span>
                    <span className="block text-xs text-stone-500">/blog/category/{c.slug} · {t("admin.blog.postCount", { n: catCount(c.id) })}</span>
                  </span>
                  <span className="text-sm text-emerald-700">{t("common.edit")}</span>
                </summary>
                <div className="mt-4 grid gap-3">
                  <ActionForm action={saveBlogCategory} submitLabel={t("common.save")}>
                    {categoryFields(c)}
                  </ActionForm>
                  <ConfirmForm
                    action={deleteBlogCategory}
                    fields={{ id: c.id }}
                    confirm={t("admin.blog.confirmDeleteCategory", { name: c.name_en })}
                    label={t("common.delete")}
                    variant="danger"
                  />
                </div>
              </details>
            </Card>
          ))}
          <Card title={t("admin.blog.newCategory")}>
            <ActionForm action={saveBlogCategory} submitLabel={t("admin.blog.addCategory")}>
              {categoryFields()}
            </ActionForm>
          </Card>
        </section>

        <section className="grid content-start gap-4">
          <h2 className="text-lg font-semibold text-stone-900">{t("admin.blog.tags")}</h2>
          <Card>
            <ul className="divide-y divide-stone-100">
              {tags.map((tag) => (
                <li key={tag.id} className="py-2">
                  <details>
                    <summary className="flex cursor-pointer items-center justify-between gap-2 text-sm">
                      <span>
                        <span className="font-medium text-stone-900">{tag.name_bn}</span>
                        <span className="text-stone-500"> · {tag.name_en}</span>
                        <span className="text-xs text-stone-400"> · {t("admin.blog.postCount", { n: tagCount(tag.id) })}</span>
                      </span>
                      <span className="text-emerald-700">{t("common.edit")}</span>
                    </summary>
                    <div className="mt-3 grid gap-3">
                      <ActionForm action={saveBlogTag} submitLabel={t("common.save")} className="grid gap-3 sm:grid-cols-3">
                        <input type="hidden" name="id" value={tag.id} />
                        <Field label={t("admin.blog.nameBn")}>
                          <Input name="name_bn" defaultValue={tag.name_bn} required maxLength={40} />
                        </Field>
                        <Field label={t("admin.blog.nameEn")}>
                          <Input name="name_en" defaultValue={tag.name_en} required maxLength={40} />
                        </Field>
                        <Field label={t("admin.blog.slug")}>
                          <Input name="slug" defaultValue={tag.slug} maxLength={60} pattern="[a-z0-9]+(-[a-z0-9]+)*" />
                        </Field>
                      </ActionForm>
                      <ConfirmForm
                        action={deleteBlogTag}
                        fields={{ id: tag.id }}
                        confirm={t("admin.blog.confirmDeleteTag", { name: tag.name_en })}
                        label={t("common.delete")}
                        variant="danger"
                      />
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          </Card>
          <Card title={t("admin.blog.newTag")}>
            <ActionForm action={saveBlogTag} submitLabel={t("admin.blog.addTag")} className="grid gap-3 sm:grid-cols-3">
              <Field label={t("admin.blog.nameBn")}>
                <Input name="name_bn" required maxLength={40} />
              </Field>
              <Field label={t("admin.blog.nameEn")}>
                <Input name="name_en" required maxLength={40} />
              </Field>
              <Field label={t("admin.blog.slug")}>
                <Input name="slug" maxLength={60} pattern="[a-z0-9]+(-[a-z0-9]+)*" />
              </Field>
            </ActionForm>
          </Card>
        </section>
      </div>
    </>
  );
}
