import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmForm } from "@/components/confirm-form";
import { Badge, ButtonLink, Card, EmptyState, PageHeader, Table, Td } from "@/components/ui";
import { requireSuperAdmin } from "@/lib/auth";
import { localized, type BlogPost } from "@/lib/blog";
import { getI18n } from "@/lib/i18n/server";
import { deleteBlogPost, togglePublishBlogPost } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("admin.blog.title") };
}

export default async function AdminBlogPage() {
  const { supabase } = await requireSuperAdmin();
  const { t, f, locale } = await getI18n();
  const { data } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
  const posts = (data ?? []) as BlogPost[];

  return (
    <>
      <PageHeader
        title={t("admin.blog.title")}
        description={t("admin.blog.desc")}
        action={<ButtonLink href="/admin/blog/new">{t("admin.blog.new")}</ButtonLink>}
      />
      <Card>
        {posts.length === 0 ? (
          <EmptyState title={t("admin.blog.empty")} />
        ) : (
          <Table head={[t("admin.blog.colTitle"), t("admin.blog.colStatus"), t("admin.blog.colDate"), ""]}>
            {posts.map((p) => {
              const v = localized(p, locale);
              return (
                <tr key={p.id}>
                  <Td>
                    <Link href={`/admin/blog/${p.id}`} className="font-medium text-emerald-700 hover:underline">{v.title}</Link>
                    <span className="block text-xs text-stone-500">/blog/{p.slug}</span>
                  </Td>
                  <Td>
                    <Badge tone={p.published ? "green" : "amber"}>{p.published ? t("admin.blog.statusPublished") : t("admin.blog.statusDraft")}</Badge>
                  </Td>
                  <Td>{f.date(p.published_at ?? p.created_at)}</Td>
                  <Td>
                    <span className="flex flex-wrap justify-end gap-2">
                      <Link href={`/blog/${p.slug}`} className="self-center text-sm text-stone-600 hover:underline">{t("admin.blog.view")}</Link>
                      <Link href={`/admin/blog/${p.id}`} className="self-center text-sm text-emerald-700 hover:underline">{t("common.edit")}</Link>
                      <ConfirmForm
                        action={togglePublishBlogPost}
                        fields={{ id: p.id, publish: String(!p.published) }}
                        label={p.published ? t("admin.blog.unpublish") : t("admin.blog.publish")}
                      />
                      <ConfirmForm
                        action={deleteBlogPost}
                        fields={{ id: p.id }}
                        confirm={t("admin.blog.confirmDelete", { title: v.title })}
                        label={t("common.delete")}
                        variant="danger"
                      />
                    </span>
                  </Td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>
    </>
  );
}
