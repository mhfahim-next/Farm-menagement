import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogForm } from "@/components/blog-form";
import { Card, PageHeader } from "@/components/ui";
import { requireSuperAdmin } from "@/lib/auth";
import type { BlogCategory, BlogImage, BlogPost, BlogTag } from "@/lib/blog";
import { getI18n } from "@/lib/i18n/server";
import { updateBlogPost } from "../actions";

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
    </>
  );
}
