"use client";

import { useState } from "react";
import type { ActionState } from "@/lib/types";
import { slugify, type BlogPost } from "@/lib/blog";
import { ActionForm } from "./action-form";
import { useI18n } from "./i18n-provider";
import { Field, Input, Textarea } from "./ui";

/** Create / edit a blog post (both languages; at least one must be complete). */
export function BlogForm({
  action,
  post,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  post?: BlogPost;
}) {
  const { t } = useI18n();
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!post);

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
          <Textarea name="body_bn" rows={18} defaultValue={post?.body_bn ?? ""} className="font-mono text-sm sm:text-sm" />
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
          <Textarea name="body_en" rows={18} defaultValue={post?.body_en ?? ""} className="font-mono text-sm sm:text-sm" />
        </Field>
      </fieldset>

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
