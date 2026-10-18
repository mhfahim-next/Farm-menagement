"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth";
import { BLOG_BUCKET, imageBaseName, imageUrl, slugify, type BlogImage } from "@/lib/blog";
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
  category_id: string | null;
  cover_image_id: string | null;
  tag_ids: string[];
  new_tags: string[];
};

const UUID = /^[0-9a-f-]{36}$/i;

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
    category_id: str(formData, "category_id"),
    cover_image_id: str(formData, "cover_image_id"),
    tag_ids: formData.getAll("tag_ids").filter((x): x is string => typeof x === "string" && UUID.test(x)),
    new_tags: (str(formData, "new_tags") ?? "")
      .split(/[,،]/)
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 10),
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

  // Tags typed into "new tags" are created on the fly (same name in both languages; edit later).
  const tagIds = new Set(v.tag_ids);
  for (const name of v.new_tags) {
    const slug = slugify(name) || `tag-${Date.now().toString(36)}${tagIds.size}`;
    const { data: tagId, error } = await supabase.rpc("admin_save_blog_tag", {
      p_id: null, p_slug: slug, p_name_en: name.slice(0, 40), p_name_bn: name.slice(0, 40),
    });
    if (error) return { error: error.message };
    tagIds.add(tagId as string);
  }

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
    p_category_id: v.category_id,
    p_cover_image_id: v.cover_image_id,
    p_tag_ids: [...tagIds],
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

  const { error } = await supabase.rpc("admin_set_blog_published", { p_id: id, p_published: publish });
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

// ---------------------------------------------------------------------
// Image library
// ---------------------------------------------------------------------

/** First free "<name>.webp", "<name>-2.webp"… in the library. */
async function freePath(supabase: Awaited<ReturnType<typeof requireSuperAdmin>>["supabase"], name: string, ext: string, exceptId?: string) {
  const base = imageBaseName(name);
  const candidates = Array.from({ length: 30 }, (_, i) => `${base}${i ? `-${i + 1}` : ""}.${ext}`);
  const { data } = await supabase.from("blog_images").select("id, path").in("path", candidates);
  const taken = new Set((data ?? []).filter((r) => r.id !== exceptId).map((r) => r.path as string));
  return candidates.find((c) => !taken.has(c)) ?? `${base}-${Date.now().toString(36)}.${ext}`;
}

/** Step 1 of an upload: pick an unused, SEO-friendly file name. The browser then uploads to it. */
export async function reserveBlogImagePath(name: string): Promise<{ path: string }> {
  const { supabase } = await requireSuperAdmin();
  return { path: await freePath(supabase, name, "webp") };
}

/** Step 2: record the uploaded file with its alt text. */
export async function registerBlogImage(input: {
  path: string;
  alt_en: string;
  alt_bn: string;
  caption_en: string;
  caption_bn: string;
  width: number;
  height: number;
  size_bytes: number;
}): Promise<{ error?: string; image?: BlogImage }> {
  const { supabase } = await requireSuperAdmin();
  const { data: id, error } = await supabase.rpc("admin_save_blog_image", {
    p_id: null,
    p_path: input.path,
    p_alt_en: input.alt_en,
    p_alt_bn: input.alt_bn,
    p_caption_en: input.caption_en,
    p_caption_bn: input.caption_bn,
    p_width: Math.round(input.width) || null,
    p_height: Math.round(input.height) || null,
    p_size_bytes: Math.round(input.size_bytes) || null,
  });
  if (error) {
    await supabase.storage.from(BLOG_BUCKET).remove([input.path]);
    return { error: error.message };
  }
  const { data } = await supabase.from("blog_images").select("*").eq("id", id as string).single();
  revalidatePath("/admin/blog", "layout");
  return { image: data as BlogImage };
}

/** Saves alt text / caption, and renames the file when the name changed (articles are updated too). */
export async function updateBlogImage(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireSuperAdmin();
  const { t } = await getI18n();
  const id = str(formData, "id");
  if (!id || !UUID.test(id)) return { error: t("common.errorGeneric") };
  const { data: img } = await supabase.from("blog_images").select("*").eq("id", id).maybeSingle();
  if (!img) return { error: t("common.errorGeneric") };

  const { error } = await supabase.rpc("admin_save_blog_image", {
    p_id: id,
    p_path: img.path,
    p_alt_en: str(formData, "alt_en"),
    p_alt_bn: str(formData, "alt_bn"),
    p_caption_en: str(formData, "caption_en"),
    p_caption_bn: str(formData, "caption_bn"),
    p_width: null,
    p_height: null,
    p_size_bytes: null,
  });
  if (error) return { error: error.message };

  const name = str(formData, "name");
  const ext = (img.path as string).split(".").pop()!;
  if (name && imageBaseName(name) !== (img.path as string).replace(/\.[a-z]+$/, "")) {
    const next = await freePath(supabase, name, ext, id);
    const { error: moveError } = await supabase.storage.from(BLOG_BUCKET).move(img.path, next);
    if (moveError) return { error: moveError.message };
    const { error: renameError } = await supabase.rpc("admin_rename_blog_image", {
      p_id: id,
      p_new_path: next,
      p_old_url: imageUrl(img.path),
      p_new_url: imageUrl(next),
    });
    if (renameError) {
      await supabase.storage.from(BLOG_BUCKET).move(next, img.path);
      return { error: renameError.message };
    }
  }
  revalidatePath("/blog", "layout");
  revalidatePath("/admin/blog", "layout");
  return { success: t("admin.blog.imageSaved") };
}

export async function deleteBlogImage(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireSuperAdmin();
  const { t } = await getI18n();
  const id = str(formData, "id");
  if (!id || !UUID.test(id)) return { error: t("common.errorGeneric") };
  const { data: path, error } = await supabase.rpc("admin_delete_blog_image", { p_id: id });
  if (error) return { error: error.message };
  await supabase.storage.from(BLOG_BUCKET).remove([path as string]);
  revalidatePath("/blog", "layout");
  revalidatePath("/admin/blog", "layout");
  return { success: t("admin.blog.imageDeleted") };
}

// ---------------------------------------------------------------------
// Categories and tags
// ---------------------------------------------------------------------

export async function saveBlogCategory(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireSuperAdmin();
  const { t } = await getI18n();
  const name_en = str(formData, "name_en");
  const name_bn = str(formData, "name_bn");
  if (!name_en || !name_bn) return { error: t("admin.blog.errName") };
  const slug = (str(formData, "slug") ?? slugify(name_en)).toLowerCase();
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return { error: t("admin.blog.errSlug") };
  const { error } = await supabase.rpc("admin_save_blog_category", {
    p_id: str(formData, "id"),
    p_slug: slug,
    p_name_en: name_en,
    p_name_bn: name_bn,
    p_description_en: str(formData, "description_en"),
    p_description_bn: str(formData, "description_bn"),
    p_sort_order: Number(str(formData, "sort_order") ?? 0) || 0,
  });
  if (error) return { error: error.code === "23505" ? t("admin.blog.errSlugTaken", { slug }) : error.message };
  revalidatePath("/blog", "layout");
  revalidatePath("/admin/blog", "layout");
  return { success: t("admin.blog.taxSaved") };
}

export async function deleteBlogCategory(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireSuperAdmin();
  const { t } = await getI18n();
  const { error } = await supabase.rpc("admin_delete_blog_category", { p_id: str(formData, "id") });
  if (error) return { error: error.message };
  revalidatePath("/blog", "layout");
  revalidatePath("/admin/blog", "layout");
  return { success: t("admin.blog.taxDeleted") };
}

export async function saveBlogTag(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireSuperAdmin();
  const { t } = await getI18n();
  const name_en = str(formData, "name_en");
  const name_bn = str(formData, "name_bn");
  if (!name_en || !name_bn) return { error: t("admin.blog.errName") };
  const slug = (str(formData, "slug") ?? slugify(name_en)).toLowerCase();
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return { error: t("admin.blog.errSlug") };
  const { error } = await supabase.rpc("admin_save_blog_tag", {
    p_id: str(formData, "id"),
    p_slug: slug,
    p_name_en: name_en,
    p_name_bn: name_bn,
  });
  if (error) return { error: error.code === "23505" ? t("admin.blog.errSlugTaken", { slug }) : error.message };
  revalidatePath("/blog", "layout");
  revalidatePath("/admin/blog", "layout");
  return { success: t("admin.blog.taxSaved") };
}

export async function deleteBlogTag(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireSuperAdmin();
  const { t } = await getI18n();
  const { error } = await supabase.rpc("admin_delete_blog_tag", { p_id: str(formData, "id") });
  if (error) return { error: error.message };
  revalidatePath("/blog", "layout");
  revalidatePath("/admin/blog", "layout");
  return { success: t("admin.blog.taxDeleted") };
}
