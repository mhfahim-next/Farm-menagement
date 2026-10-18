"use client";

import { useRef, useState } from "react";
import { COMMUNITY_BUCKET, communityImageUrl, MAX_COMMUNITY_IMAGES } from "@/lib/community";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "../i18n-provider";
import { Button, Spinner } from "../ui";

const MAX_INPUT_BYTES = 15 * 1024 * 1024;
const MAX_SIDE = 1280;

/** Shrinks a photo to at most 1280px and WebP, so uploads are quick on mobile data. */
async function toWebp(file: File) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), "image/webp", 0.8),
  );
}

/**
 * Adds up to 4 photos to a question or answer. Files go straight to the
 * member's own folder in storage; the form only carries their paths.
 */
export function CommunityImagePicker({ userId }: { userId: string }) {
  const { t } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const [paths, setPaths] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    setBusy(true);
    try {
      const room = MAX_COMMUNITY_IMAGES - paths.length;
      for (const file of [...files].slice(0, room)) {
        if (!file.type.startsWith("image/")) throw new Error(t("community.imageBadType"));
        if (file.size > MAX_INPUT_BYTES) throw new Error(t("community.imageTooBig"));
        const blob = await toWebp(file);
        const path = `${userId}/${crypto.randomUUID()}.webp`;
        const { error } = await createClient().storage.from(COMMUNITY_BUCKET).upload(path, blob, {
          contentType: "image/webp",
          cacheControl: "31536000",
        });
        if (error) throw new Error(t("community.imageFailed"));
        setPaths((p) => [...p, path]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("community.imageFailed"));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  function remove(path: string) {
    setPaths((p) => p.filter((x) => x !== path));
    createClient().storage.from(COMMUNITY_BUCKET).remove([path]);
  }

  return (
    <div className="grid gap-2">
      {paths.map((p) => (
        <input key={p} type="hidden" name="images" value={p} />
      ))}
      {paths.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {paths.map((p) => (
            <li key={p} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- small preview of the member's own upload */}
              <img src={communityImageUrl(p)} alt="" className="h-20 w-20 rounded-lg border border-stone-200 object-cover" />
              <button
                type="button"
                onClick={() => remove(p)}
                aria-label={t("community.removePhoto")}
                className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-stone-900 text-xs text-white"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        data-testid="community-image-input"
        onChange={(e) => add(e.target.files)}
      />
      {paths.length < MAX_COMMUNITY_IMAGES && (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" disabled={busy} onClick={() => input.current?.click()}>
            {busy ? <Spinner className="mr-2" /> : <span aria-hidden className="mr-1.5">📷</span>}
            {busy ? t("community.uploading") : t("community.addPhoto")}
          </Button>
          <span className="text-xs text-stone-500">{t("community.photoHint", { n: MAX_COMMUNITY_IMAGES })}</span>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
