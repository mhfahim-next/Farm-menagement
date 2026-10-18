import type { Metadata } from "next";
import Link from "next/link";
import { BlogForm } from "@/components/blog-form";
import { Card, PageHeader } from "@/components/ui";
import { requireSuperAdmin } from "@/lib/auth";
import type { BlogCategory, BlogImage, BlogTag } from "@/lib/blog";
import { getI18n } from "@/lib/i18n/server";
import { createBlogPost } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("admin.blog.new") };
}

export default async function NewBlogPostPage() {
  const { supabase } = await requireSuperAdmin();
  const { t } = await getI18n();
  const [{ data: categories }, { data: tags }, { data: images }] = await Promise.all([
    supabase.from("blog_categories").select("*").order("sort_order"),
    supabase.from("blog_tags").select("*").order("name_en"),
    supabase.from("blog_images").select("*").order("created_at", { ascending: false }),
  ]);
  return (
    <>
      <PageHeader
        title={t("admin.blog.new")}
        action={<Link href="/admin/blog" className="text-sm text-stone-500 hover:text-stone-900">{t("common.back")}</Link>}
      />
      <Card className="max-w-3xl">
        <BlogForm
          action={createBlogPost}
          categories={(categories ?? []) as BlogCategory[]}
          tags={(tags ?? []) as BlogTag[]}
          images={(images ?? []) as BlogImage[]}
        />
      </Card>
    </>
  );
}
