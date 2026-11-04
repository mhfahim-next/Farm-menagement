import type { Metadata } from "next";
import { ActionForm } from "@/components/action-form";
import { BlogLibraryUpload, BlogThumb, CopyImageMarkdown } from "@/components/blog-media";
import { ConfirmForm } from "@/components/confirm-form";
import { Card, EmptyState, Field, Input, PageHeader } from "@/components/ui";
import { requireSuperAdmin } from "@/lib/auth";
import { imageUrl, type BlogImage } from "@/lib/blog";
import { getI18n } from "@/lib/i18n/server";
import { deleteBlogImage, updateBlogImage } from "../actions";
import { BlogAdminTabs } from "../tabs";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("admin.blog.tabMedia") };
}

export default async function BlogMediaPage() {
  const { supabase } = await requireSuperAdmin();
  const { t, f } = await getI18n();
  const [{ data }, { data: posts }] = await Promise.all([
    supabase.from("blog_images").select("*").order("created_at", { ascending: false }),
    supabase.from("blog_posts").select("cover_image_id, body_en, body_bn"),
  ]);
  const images = (data ?? []) as BlogImage[];
  const usedIn = (img: BlogImage) => {
    const url = imageUrl(img.path);
    return (posts ?? []).filter(
      (p) => p.cover_image_id === img.id || p.body_en?.includes(url) || p.body_bn?.includes(url),
    ).length;
  };

  return (
    <>
      <PageHeader title={t("admin.blog.title")} description={t("admin.blog.mediaDesc")} />
      <BlogAdminTabs active="media" />
      <Card title={t("admin.blog.imageUpload")} className="mb-6">
        <BlogLibraryUpload />
      </Card>

      {images.length === 0 ? (
        <Card>
          <EmptyState title={t("admin.blog.mediaEmpty")} />
        </Card>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {images.map((img) => {
            const uses = usedIn(img);
            return (
              <li key={img.id}>
                <Card>
                  <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
                    <div className="grid content-start gap-1.5">
                      <a href={imageUrl(img.path)} target="_blank" rel="noopener noreferrer">
                        <BlogThumb image={img} />
                      </a>
                      <p className="text-xs text-stone-500">
                        {img.width && img.height ? `${img.width}×${img.height} · ` : ""}
                        {img.size_bytes ? `${Math.round(img.size_bytes / 1024)} KB · ` : ""}
                        {f.date(img.created_at)}
                      </p>
                      <p className="text-xs text-stone-500">{t("admin.blog.usedIn", { n: uses })}</p>
                      <CopyImageMarkdown image={img} />
                    </div>
                    <ActionForm action={updateBlogImage} submitLabel={t("common.save")} className="grid gap-3">
                      <input type="hidden" name="id" value={img.id} />
                      <Field label={t("admin.blog.imageName")} hint={t("admin.blog.renameHint")}>
                        <Input name="name" defaultValue={img.path.replace(/\.[a-z]+$/, "")} maxLength={100} />
                      </Field>
                      <Field label={t("admin.blog.altBn")}>
                        <Input name="alt_bn" defaultValue={img.alt_bn ?? ""} maxLength={250} />
                      </Field>
                      <Field label={t("admin.blog.altEn")}>
                        <Input name="alt_en" defaultValue={img.alt_en ?? ""} maxLength={250} />
                      </Field>
                      <Field label={t("admin.blog.captionBn")}>
                        <Input name="caption_bn" defaultValue={img.caption_bn ?? ""} maxLength={300} />
                      </Field>
                      <Field label={t("admin.blog.captionEn")}>
                        <Input name="caption_en" defaultValue={img.caption_en ?? ""} maxLength={300} />
                      </Field>
                    </ActionForm>
                  </div>
                  <div className="mt-3 border-t border-stone-100 pt-3">
                    <ConfirmForm
                      action={deleteBlogImage}
                      fields={{ id: img.id }}
                      confirm={uses ? t("admin.blog.confirmDeleteUsed", { n: uses }) : t("admin.blog.confirmDeleteImage")}
                      label={t("common.delete")}
                      variant="danger"
                    />
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
