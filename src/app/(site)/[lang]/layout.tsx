import { BanglaSuggest } from "@/components/bangla-suggest";
import { RootDocument, rootMetadata, rootViewport } from "@/components/root-document";
import { notFound } from "next/navigation";
import { isLocale, LOCALES } from "@/lib/i18n/core";

// Public pages. The language is part of the address: English has no prefix
// (/blog, rewritten to /en/blog by the proxy) and Bangla lives under /bn
// (/bn/blog). Pages read it with getLocale() (next/root-params), never from
// a cookie, so each address always shows the same language.
export const viewport = rootViewport;
export const generateMetadata = rootMetadata;

// Both languages are built ahead; pages below (blog posts, questions…) are
// made on their first visit and cached. The proxy only ever sends /en or /bn
// here, and anything else is a 404.
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export default async function SiteRootLayout({ children, params }: LayoutProps<"/[lang]">) {
  if (!isLocale((await params).lang)) notFound();
  return (
    <RootDocument>
      {children}
      <BanglaSuggest />
    </RootDocument>
  );
}
