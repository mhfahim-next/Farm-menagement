"use client";

import NextLink from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { isDynamicPath, localePath } from "@/lib/i18n/paths";
import { useI18n } from "./i18n-provider";

/**
 * next/link that keeps the visitor in their language: on Bangla pages a link to
 * a public page ("/blog") goes to its Bangla address ("/bn/blog"). Links to the
 * dashboard, files and other sites are unchanged.
 *
 * Links to pages made per request (the dashboard, login, sign-up…) are
 * prefetched on intent (hover, touch, keyboard focus) instead of as soon as
 * they are visible, which used to render each of them on the server once per
 * page view. Pass `prefetch` to choose yourself.
 */
export default function Link({ href, prefetch, onMouseEnter, onTouchStart, onFocus, ...props }: ComponentProps<typeof NextLink>) {
  const { locale } = useI18n();
  const router = useRouter();
  const target = typeof href === "string" ? localePath(href, locale) : href;
  const onIntent = prefetch === undefined && typeof target === "string" && isDynamicPath(target);
  if (!onIntent) return <NextLink href={target} prefetch={prefetch} onMouseEnter={onMouseEnter} onTouchStart={onTouchStart} onFocus={onFocus} {...props} />;
  const warm = () => router.prefetch(target as string);
  return (
    <NextLink
      href={target}
      prefetch={false}
      onMouseEnter={(e) => {
        warm();
        onMouseEnter?.(e);
      }}
      onTouchStart={(e) => {
        warm();
        onTouchStart?.(e);
      }}
      onFocus={(e) => {
        warm();
        onFocus?.(e);
      }}
      {...props}
    />
  );
}
