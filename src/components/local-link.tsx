"use client";

import NextLink from "next/link";
import type { ComponentProps } from "react";
import { localePath } from "@/lib/i18n/paths";
import { useI18n } from "./i18n-provider";

/**
 * next/link that keeps the visitor in their language: on Bangla pages a link to
 * a public page ("/blog") goes to its Bangla address ("/bn/blog"). Links to the
 * dashboard, files and other sites are unchanged.
 */
export default function Link({ href, ...props }: ComponentProps<typeof NextLink>) {
  const { locale } = useI18n();
  return <NextLink href={typeof href === "string" ? localePath(href, locale) : href} {...props} />;
}
