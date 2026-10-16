import type { Metadata } from "next";
import Link from "next/link";
import { BlogForm } from "@/components/blog-form";
import { Card, PageHeader } from "@/components/ui";
import { requireSuperAdmin } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { createBlogPost } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("admin.blog.new") };
}

export default async function NewBlogPostPage() {
  await requireSuperAdmin();
  const { t } = await getI18n();
  return (
    <>
      <PageHeader
        title={t("admin.blog.new")}
        action={<Link href="/admin/blog" className="text-sm text-stone-500 hover:text-stone-900">{t("common.back")}</Link>}
      />
      <Card className="max-w-3xl">
        <BlogForm action={createBlogPost} />
      </Card>
    </>
  );
}
