"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { registerBlogImage, reserveBlogImagePath } from "@/app/admin/blog/actions";
import { BLOG_BUCKET, imageBaseName, imageUrl, pickLang, type BlogImage } from "@/lib/blog";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "./i18n-provider";
import { useResultToast } from "./toast";
import { Button, Field, Input, Spinner } from "./ui";

const MAX_INPUT_BYTES = 15 * 1024 * 1024;
const MAX_WIDTH = 1600;
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

/** Scales the photo down to at most 1600px wide and re-encodes it as WebP (small and fast). */
async function toWebp(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_WIDTH / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), "image/webp", 0.82),
  );
  return { blob, width, height };
}

/** Upload a photo to the blog library with an SEO file name, alt text and caption. */
export function BlogImageUpload({ onUploaded }: { onUploaded?: (image: BlogImage) => void }) {
  const { t } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [text, setText] = useState({ alt_bn: "", alt_en: "", caption_bn: "", caption_en: "" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ error?: string; success?: string } | null>(null);
  useResultToast(message);

  function pick(f: File | undefined) {
    setMessage(null);
    if (!f) return;
    if (!TYPES.includes(f.type)) return setMessage({ error: t("admin.blog.imageBadType") });
    if (f.size > MAX_INPUT_BYTES) return setMessage({ error: t("admin.blog.imageTooBig") });
    setFile(f);
    setName(imageBaseName(f.name));
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
  }

  // No <form> here: this box also sits inside the article form, and forms can't be nested.
  async function upload() {
    if (!file) return setMessage({ error: t("admin.blog.imagePick") });
    const v = (k: keyof typeof text) => text[k].trim();
    if (!v("alt_bn") && !v("alt_en")) return setMessage({ error: t("admin.blog.imageNeedAlt") });

    setBusy(true);
    setMessage(null);
    try {
      const { blob, width, height } = await toWebp(file);
      const { path } = await reserveBlogImagePath(name || file.name);
      const { error } = await createClient().storage.from(BLOG_BUCKET).upload(path, blob, {
        contentType: "image/webp",
        cacheControl: "31536000",
      });
      if (error) throw error;
      const result = await registerBlogImage({
        path,
        alt_en: v("alt_en"),
        alt_bn: v("alt_bn"),
        caption_en: v("caption_en"),
        caption_bn: v("caption_bn"),
        width,
        height,
        size_bytes: blob.size,
      });
      if (result.error || !result.image) throw new Error(result.error);
      setMessage({ success: t("admin.blog.imageUploaded") });
      onUploaded?.(result.image);
      setText({ alt_bn: "", alt_en: "", caption_bn: "", caption_en: "" });
      setFile(null);
      setName("");
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
    } catch (e) {
      setMessage({ error: e instanceof Error && e.message ? e.message : t("admin.blog.imageFailed") });
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div
      role="group"
      aria-label={t("admin.blog.imageUpload")}
      className="grid gap-3 rounded-lg border border-dashed border-stone-300 p-3 sm:p-4"
      onKeyDown={(e) => {
        // Enter must not submit the article form around this box.
        if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") e.preventDefault();
      }}
    >
        <div className="flex flex-wrap items-center gap-3">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- local preview
            <img src={preview} alt="" className="h-20 w-28 rounded-lg border border-stone-200 object-cover" />
          ) : (
            <div className="grid h-20 w-28 place-items-center rounded-lg bg-stone-100 text-2xl text-stone-400" aria-hidden>
              🖼
            </div>
          )}
          <input
            ref={input}
            type="file"
            accept={TYPES.join(",")}
            className="sr-only"
            data-testid="blog-image-input"
            onChange={(e) => pick(e.target.files?.[0])}
          />
          <Button type="button" variant="secondary" disabled={busy} onClick={() => input.current?.click()}>
            {file ? t("admin.blog.imageChoose2") : t("admin.blog.imageChoose")}
          </Button>
          <p className="text-xs text-stone-500">{t("admin.blog.imageHint")}</p>
        </div>

        <Field label={t("admin.blog.imageName")} hint={t("admin.blog.imageNameHint")}>
          <span className="flex items-center gap-1">
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder="cow-vaccine-schedule" />
            <span className="text-sm text-stone-500">.webp</span>
          </span>
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("admin.blog.altBn")} hint={t("admin.blog.altHint")}>
            <Input value={text.alt_bn} onChange={(e) => setText((x) => ({ ...x, alt_bn: e.target.value }))} maxLength={250} />
          </Field>
          <Field label={t("admin.blog.altEn")}>
            <Input value={text.alt_en} onChange={(e) => setText((x) => ({ ...x, alt_en: e.target.value }))} maxLength={250} />
          </Field>
          <Field label={t("admin.blog.captionBn")}>
            <Input value={text.caption_bn} onChange={(e) => setText((x) => ({ ...x, caption_bn: e.target.value }))} maxLength={300} />
          </Field>
          <Field label={t("admin.blog.captionEn")}>
            <Input value={text.caption_en} onChange={(e) => setText((x) => ({ ...x, caption_en: e.target.value }))} maxLength={300} />
          </Field>
        </div>
        <div>
          <Button type="button" disabled={busy || !file} onClick={upload}>
            {busy && <Spinner className="mr-2" />}
            {busy ? t("admin.blog.imageUploading") : t("admin.blog.imageUploadBtn")}
          </Button>
        </div>
        {message?.error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{message.error}</p>
        )}
    </div>
  );
}

/** Markdown for an image: ![alt](url). */
export function imageMarkdown(img: BlogImage, lang: "en" | "bn") {
  const alt = pickLang(img, "alt", lang).replace(/[[\]]/g, "");
  return `![${alt}](${imageUrl(img.path)})`;
}

/** A thumbnail with its file name, for pickers and the library. */
export function BlogThumb({ image, className = "" }: { image: BlogImage; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- small admin thumbnail straight from storage
    <img
      src={imageUrl(image.path)}
      alt={image.alt_en ?? image.alt_bn ?? ""}
      loading="lazy"
      className={`aspect-[4/3] w-full rounded-lg border border-stone-200 bg-stone-100 object-cover ${className}`}
    />
  );
}

/** The upload box on the library page: refreshes the list after each upload. */
export function BlogLibraryUpload() {
  const router = useRouter();
  return <BlogImageUpload onUploaded={() => router.refresh()} />;
}

/** Copies the Markdown for an image so it can be pasted into any article. */
export function CopyImageMarkdown({ image }: { image: BlogImage }) {
  const { t } = useI18n();
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="text-sm font-medium text-emerald-700 hover:underline"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(imageMarkdown(image, "bn"));
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          // Clipboard blocked: nothing to do, the URL is visible on the card.
        }
      }}
    >
      {done ? t("admin.blog.copied") : t("admin.blog.copyMarkdown")}
    </button>
  );
}
