import type { Metadata } from "next";
import Link from "@/components/local-link";
import { notFound } from "next/navigation";
import { BlogForm } from "@/components/blog-form";
import { ActionForm } from "@/components/action-form";
import { Card, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { requireSuperAdmin } from "@/lib/auth";
import type { BlogCategory, BlogImage, BlogPost, BlogTag } from "@/lib/blog";
import { getI18n } from "@/lib/i18n/server";
import { saveBlogCredits, updateBlogPost } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("admin.blog.edit") };
}

export default async function EditBlogPostPage({ params }: PageProps<"/admin/blog/[id]">) {
  const { id } = await params;
  const { supabase } = await requireSuperAdmin();
  const { t } = await getI18n();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [{ data }, { data: links }, { data: categories }, { data: tags }, { data: images }] = await Promise.all([
    supabase.from("blog_posts").select("*").eq("id", id).maybeSingle(),
    supabase.from("blog_post_tags").select("tag_id").eq("post_id", id),
    supabase.from("blog_categories").select("*").order("sort_order"),
    supabase.from("blog_tags").select("*").order("name_en"),
    supabase.from("blog_images").select("*").order("created_at", { ascending: false }),
  ]);
  const post = data as BlogPost | null;
  if (!post) notFound();

  return (
    <>
      <PageHeader
        title={t("admin.blog.edit")}
        action={
          <span className="flex gap-4 text-sm">
            <Link href={`/blog/${post.slug}`} className="text-emerald-700 hover:underline">{t("admin.blog.view")}</Link>
            <Link href="/admin/blog" className="text-stone-500 hover:text-stone-900">{t("common.back")}</Link>
          </span>
        }
      />
      <Card className="max-w-3xl">
        <BlogForm
          action={updateBlogPost}
          post={post}
          postTagIds={(links ?? []).map((l) => l.tag_id as string)}
          categories={(categories ?? []) as BlogCategory[]}
          tags={(tags ?? []) as BlogTag[]}
          images={(images ?? []) as BlogImage[]}
        />
      </Card>
      <Card className="mt-6 max-w-3xl" title={t("admin.blog.creditsTitle")} description={t("admin.blog.creditsDesc")}>
        <ActionForm action={saveBlogCredits} submitLabel={t("admin.blog.saveCredits")}>
          <input type="hidden" name="id" value={post.id} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="health_topic" defaultChecked={post.health_topic ?? false} className="accent-emerald-700" data-testid="credits-health" />
            {t("admin.blog.healthTopic")}
          </label>
          <Field label={t("admin.blog.authorName")} hint={t("admin.blog.authorHint")}>
            <Input name="author_name" defaultValue={post.author_name ?? ""} maxLength={100} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("admin.blog.reviewerName")} hint={t("admin.blog.reviewerHint")}>
              <Input name="reviewer_name" defaultValue={post.reviewer_name ?? ""} maxLength={100} data-testid="credits-reviewer" />
            </Field>
            <Field label={t("admin.blog.reviewerCredentials")}>
              <Input name="reviewer_credentials" defaultValue={post.reviewer_credentials ?? ""} maxLength={200} placeholder="DVM, BVC reg. …" />
            </Field>
          </div>
          <Field label={t("admin.blog.reviewedOn")}>
            <Input type="date" name="reviewed_on" defaultValue={post.reviewed_on ?? ""} className="max-w-48" />
          </Field>
          <Field label={t("admin.blog.sourcesField")} hint={t("admin.blog.sourcesHint")}>
            <Textarea
              name="sources"
              rows={5}
              defaultValue={(post.sources ?? []).map((s) => `${s.title_en ?? ""} | ${s.title_bn ?? ""} | ${s.url}`).join("\n")}
              data-testid="credits-sources"
            />
          </Field>
        </ActionForm>
      </Card>
    </>
  );
}
