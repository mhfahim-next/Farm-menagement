import { BanglaSuggest } from "@/components/bangla-suggest";
import { RootDocument, rootMetadata, rootViewport } from "@/components/root-document";
import { LOCALES } from "@/lib/i18n/core";

// Public pages. The language is part of the address: English has no prefix
// (/blog, rewritten to /en/blog by the proxy) and Bangla lives under /bn
// (/bn/blog). Pages read it with getLocale() (next/root-params), never from
// a cookie, so each address always shows the same language.
export const viewport = rootViewport;
export const generateMetadata = rootMetadata;

export const dynamicParams = false;
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export default function SiteRootLayout({ children }: LayoutProps<"/[lang]">) {
  return (
    <RootDocument>
      {children}
      <BanglaSuggest />
    </RootDocument>
  );
}
