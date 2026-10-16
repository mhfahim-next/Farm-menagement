"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth";
import { slugify } from "@/lib/blog";
import { str } from "@/lib/form";
import { getI18n } from "@/lib/i18n/server";
import type { ActionState } from "@/lib/types";

type Fields = {
  id: string | null;
  slug: string;
  title_en: string | null;
  title_bn: string | null;
  summary_en: string | null;
  summary_bn: string | null;
  body_en: string | null;
  body_bn: string | null;
  published: boolean;
};

function read(formData: FormData): Fields {
  const title_en = str(formData, "title_en");
  return {
    id: str(formData, "id"),
    slug: (str(formData, "slug") ?? slugify(title_en ?? "")).toLowerCase(),
    title_en,
    title_bn: str(formData, "title_bn"),
    summary_en: str(formData, "summary_en"),
    summary_bn: str(formData, "summary_bn"),
    body_en: str(formData, "body_en"),
    body_bn: str(formData, "body_bn"),
    published: formData.get("published") === "on",
  };
}

async function save(formData: FormData): Promise<{ error?: string; id?: string }> {
  const { supabase } = await requireSuperAdmin();
  const { t } = await getI18n();
  const v = read(formData);

  if (!v.slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(v.slug)) return { error: t("admin.blog.errSlug") };
  const hasEn = !!v.title_en && !!v.body_en;
  const hasBn = !!v.title_bn && !!v.body_bn;
  if (!hasEn && !hasBn) return { error: t("admin.blog.errContent") };

  const { data, error } = await supabase.rpc("admin_save_blog_post", {
    p_id: v.id,
    p_slug: v.slug,
    p_title_en: v.title_en,
    p_title_bn: v.title_bn,
    p_summary_en: v.summary_en,
    p_summary_bn: v.summary_bn,
    p_body_en: v.body_en,
    p_body_bn: v.body_bn,
    p_published: v.published,
  });
  if (error) {
    if (error.code === "23505") return { error: t("admin.blog.errSlugTaken", { slug: v.slug }) };
    return { error: error.message };
  }
  revalidatePath("/blog", "layout");
  revalidatePath("/admin/blog", "layout");
  return { id: data as string };
}

export async function createBlogPost(_: ActionState, formData: FormData): Promise<ActionState> {
  const r = await save(formData);
  if (r.error) return { error: r.error };
  redirect(`/admin/blog/${r.id}`);
}

export async function updateBlogPost(_: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const r = await save(formData);
  if (r.error) return { error: r.error };
  return { success: t("admin.blog.saved") };
}

export async function togglePublishBlogPost(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireSuperAdmin();
  const { t } = await getI18n();
  const id = str(formData, "id");
  if (!id) return { error: t("common.errorGeneric") };
  const publish = formData.get("publish") === "true";

  const { data: post } = await supabase.from("blog_posts").select("*").eq("id", id).maybeSingle();
  if (!post) return { error: t("common.errorGeneric") };
  const { error } = await supabase.rpc("admin_save_blog_post", {
    p_id: id,
    p_slug: post.slug,
    p_title_en: post.title_en,
    p_title_bn: post.title_bn,
    p_summary_en: post.summary_en,
    p_summary_bn: post.summary_bn,
    p_body_en: post.body_en,
    p_body_bn: post.body_bn,
    p_published: publish,
  });
  if (error) return { error: error.message };
  revalidatePath("/blog", "layout");
  revalidatePath("/admin/blog", "layout");
  return { success: t(publish ? "admin.blog.publishedToast" : "admin.blog.unpublishedToast") };
}

export async function deleteBlogPost(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireSuperAdmin();
  const { t } = await getI18n();
  const id = str(formData, "id");
  if (!id) return { error: t("common.errorGeneric") };
  const { error } = await supabase.rpc("admin_delete_blog_post", { p_id: id });
  if (error) return { error: error.message };
  revalidatePath("/blog", "layout");
  revalidatePath("/admin/blog", "layout");
  return { success: t("admin.blog.deleted") };
}
