"use client";

import { useRef, useState, useTransition } from "react";
import { removeAvatar, saveAvatar } from "@/app/dashboard/profile/actions";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "./avatar";
import { useI18n } from "./i18n-provider";
import { useResultToast } from "./toast";
import { Button, Spinner } from "./ui";

const MAX_BYTES = 2 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];
const SIZE = 256;

/** Center-crops to a square and scales down, so uploads stay small. */
async function toSquareJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIZE, SIZE);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), "image/jpeg", 0.88),
  );
}

export function AvatarUploader({
  userId,
  avatarUrl,
  name,
  email,
}: {
  userId: string;
  avatarUrl: string | null;
  name: string | null;
  email: string | null;
}) {
  const { t } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ error?: string; success?: string } | null>(null);
  const [pending, startTransition] = useTransition();
  useResultToast(message);

  async function onPick(file: File | undefined) {
    if (!file) return;
    setMessage(null);
    if (!TYPES.includes(file.type)) return setMessage({ error: t("profile.photoBadType") });
    if (file.size > MAX_BYTES) return setMessage({ error: t("profile.photoTooBig") });

    setBusy(true);
    try {
      const blob = await toSquareJpeg(file);
      const path = `${userId}/avatar-${Date.now()}.jpg`;
      const { error } = await createClient().storage.from("avatars").upload(path, blob, {
        contentType: "image/jpeg",
        cacheControl: "31536000",
      });
      if (error) throw error;
      const result = await saveAvatar(path);
      setMessage(result);
    } catch {
      setMessage({ error: t("profile.photoFailed") });
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  const disabled = busy || pending;

  return (
    <div className="flex flex-wrap items-center gap-5">
      <Avatar url={avatarUrl} name={name} email={email} size={88} />
      <div className="grid gap-2">
        <div className="flex flex-wrap gap-2">
          <input
            ref={input}
            type="file"
            accept={TYPES.join(",")}
            className="sr-only"
            data-testid="avatar-input"
            onChange={(e) => onPick(e.target.files?.[0])}
          />
          <Button type="button" variant="secondary" disabled={disabled} onClick={() => input.current?.click()}>
            {busy && <Spinner className="mr-2" />}
            {busy ? t("profile.uploading") : avatarUrl ? t("profile.change") : t("profile.upload")}
          </Button>
          {avatarUrl && (
            <Button
              type="button"
              variant="ghost"
              disabled={disabled}
              onClick={() => startTransition(async () => setMessage(await removeAvatar()))}
            >
              {t("profile.remove")}
            </Button>
          )}
        </div>
        <p className="text-xs text-stone-500">{t("profile.photoHint")}</p>
        {message?.error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{message.error}</p>
        )}
      </div>
    </div>
  );
}
