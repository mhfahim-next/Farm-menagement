"use client";

import { useRef, useState } from "react";
import type { ActionState } from "@/lib/types";
import { pickLang, slugify, type BlogCategory, type BlogImage, type BlogPost, type BlogTag } from "@/lib/blog";
import { ActionForm } from "./action-form";
import { BlogImageUpload, BlogThumb, imageMarkdown } from "./blog-media";
import { useI18n } from "./i18n-provider";
import { Button, Field, Input, Select, Textarea } from "./ui";

/** Puts text at the cursor of a textarea (on its own lines). */
function insertAtCursor(el: HTMLTextAreaElement | null, text: string) {
  if (!el) return;
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? start;
  const before = el.value.slice(0, start);
  const block = `${before && !before.endsWith("\n\n") ? (before.endsWith("\n") ? "\n" : "\n\n") : ""}${text}\n\n`;
  el.focus();
  el.setRangeText(block, start, end, "end");
}

/** Create / edit a blog post (both languages; at least one must be complete). */
export function BlogForm({
  action,
  post,
  postTagIds = [],
  categories,
  tags,
  images: initialImages,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  post?: BlogPost;
  postTagIds?: string[];
  categories: BlogCategory[];
  tags: BlogTag[];
  images: BlogImage[];
}) {
  const { t, locale } = useI18n();
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!post);
  const [images, setImages] = useState(initialImages);
  const [coverId, setCoverId] = useState(post?.cover_image_id ?? "");
  const [showUpload, setShowUpload] = useState(false);
  const bodyBn = useRef<HTMLTextAreaElement>(null);
  const bodyEn = useRef<HTMLTextAreaElement>(null);
  const cover = images.find((i) => i.id === coverId) ?? null;

  return (
    <ActionForm action={action} submitLabel={post ? t("admin.blog.save") : t("admin.blog.create")}>
      {post && <input type="hidden" name="id" value={post.id} />}

      <fieldset className="grid gap-3 rounded-lg border border-stone-200 p-3 sm:p-4">
        <legend className="px-1 text-sm font-semibold text-stone-700">{t("admin.blog.bn")}</legend>
        <Field label={t("admin.blog.fieldTitle")}>
          <Input name="title_bn" defaultValue={post?.title_bn ?? ""} maxLength={200} />
        </Field>
        <Field label={t("admin.blog.fieldSummary")}>
          <Textarea name="summary_bn" rows={2} defaultValue={post?.summary_bn ?? ""} maxLength={500} />
        </Field>
        <Field label={t("admin.blog.fieldBody")}>
          <Textarea ref={bodyBn} name="body_bn" rows={18} defaultValue={post?.body_bn ?? ""} className="font-mono text-sm sm:text-sm" />
        </Field>
      </fieldset>

      <fieldset className="grid gap-3 rounded-lg border border-stone-200 p-3 sm:p-4">
        <legend className="px-1 text-sm font-semibold text-stone-700">{t("admin.blog.en")}</legend>
        <Field label={t("admin.blog.fieldTitle")}>
          <Input
            name="title_en"
            defaultValue={post?.title_en ?? ""}
            maxLength={200}
            onChange={(e) => {
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
          />
        </Field>
        <Field label={t("admin.blog.fieldSummary")}>
          <Textarea name="summary_en" rows={2} defaultValue={post?.summary_en ?? ""} maxLength={500} />
        </Field>
        <Field label={t("admin.blog.fieldBody")}>
          <Textarea ref={bodyEn} name="body_en" rows={18} defaultValue={post?.body_en ?? ""} className="font-mono text-sm sm:text-sm" />
        </Field>
      </fieldset>

      <fieldset className="grid gap-3 rounded-lg border border-stone-200 p-3 sm:p-4">
        <legend className="px-1 text-sm font-semibold text-stone-700">{t("admin.blog.images")}</legend>
        <input type="hidden" name="cover_image_id" value={coverId} />
        <div className="flex flex-wrap items-start gap-3">
          <div className="w-40">
            {cover ? <BlogThumb image={cover} /> : (
              <div className="grid aspect-[4/3] w-full place-items-center rounded-lg bg-stone-100 text-xs text-stone-500">{t("admin.blog.noCover")}</div>
            )}
          </div>
          <div className="grid gap-1 text-sm">
            <p className="font-medium text-stone-800">{t("admin.blog.cover")}</p>
            <p className="max-w-xs text-xs text-stone-500">{t("admin.blog.coverHint")}</p>
            {cover && (
              <button type="button" className="justify-self-start text-sm text-red-700 hover:underline" onClick={() => setCoverId("")}>
                {t("admin.blog.removeCover")}
              </button>
            )}
          </div>
        </div>

        {images.length > 0 && (
          <ul className="grid max-h-96 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
            {images.map((img) => (
              <li key={img.id} className={`rounded-lg border p-2 ${img.id === coverId ? "border-emerald-500 ring-2 ring-emerald-500/30" : "border-stone-200"}`}>
                <BlogThumb image={img} />
                <p className="mt-1 truncate text-xs text-stone-600" title={img.path}>{img.path}</p>
                <p className="truncate text-xs text-stone-400">{pickLang(img, "alt", locale) || "—"}</p>
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium">
                  <button type="button" className="text-emerald-700 hover:underline" onClick={() => setCoverId(img.id)}>
                    {t("admin.blog.setCover")}
                  </button>
                  <button type="button" className="text-stone-700 hover:underline" onClick={() => insertAtCursor(bodyBn.current, imageMarkdown(img, "bn"))}>
                    + {t("admin.blog.insertBn")}
                  </button>
                  <button type="button" className="text-stone-700 hover:underline" onClick={() => insertAtCursor(bodyEn.current, imageMarkdown(img, "en"))}>
                    + {t("admin.blog.insertEn")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div>
          <Button type="button" variant="secondary" onClick={() => setShowUpload((v) => !v)} aria-expanded={showUpload}>
            {showUpload ? t("common.cancel") : `+ ${t("admin.blog.imageUpload")}`}
          </Button>
        </div>
        {showUpload && (
          <BlogImageUpload
            onUploaded={(img) => {
              setImages((list) => [img, ...list]);
              if (!coverId) setCoverId(img.id);
              setShowUpload(false);
            }}
          />
        )}
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("admin.blog.category")}>
          <Select
            name="category_id"
            defaultValue={post?.category_id ?? ""}
            options={[
              { value: "", label: t("admin.blog.noCategory") },
              ...categories.map((c) => ({ value: c.id, label: pickLang(c, "name", locale) })),
            ]}
          />
        </Field>
        <Field label={t("admin.blog.newTags")} hint={t("admin.blog.newTagsHint")}>
          <Input name="new_tags" maxLength={300} placeholder="dairy, mastitis" />
        </Field>
      </div>
      {tags.length > 0 && (
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-stone-700">{t("admin.blog.tags")}</legend>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <label key={tag.id} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-stone-300 px-3 py-1 text-sm has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50 has-[:checked]:text-emerald-800">
                <input type="checkbox" name="tag_ids" value={tag.id} defaultChecked={postTagIds.includes(tag.id)} className="accent-emerald-700" />
                {pickLang(tag, "name", locale)}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <Field label={t("admin.blog.slug")} hint={t("admin.blog.slugHint")}>
        <Input
          name="slug"
          value={slug}
          required
          maxLength={80}
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value.toLowerCase());
          }}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="published" defaultChecked={post?.published ?? false} className="accent-emerald-700" />
        {t("admin.blog.published")}
      </label>

      <details className="rounded-lg bg-stone-50 px-4 py-3 text-sm text-stone-600">
        <summary className="cursor-pointer font-medium text-stone-700">{t("admin.blog.helpTitle")}</summary>
        <pre className="mt-2 whitespace-pre-wrap font-mono text-xs leading-6">{t("admin.blog.helpBody")}</pre>
      </details>
    </ActionForm>
  );
}
