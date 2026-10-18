import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Sans_Bengali } from "next/font/google";
import { I18nProvider } from "@/components/i18n-provider";
import { Analytics } from "@/components/analytics";
import { NavProgress } from "@/components/nav-progress";
import { PwaRegister } from "@/components/pwa";
import { ToastProvider } from "@/components/toast";
import { Suspense } from "react";
import { getI18n, getOptionRows, messagesFor } from "@/lib/i18n/server";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoBengali = Noto_Sans_Bengali({
  variable: "--font-bengali",
  subsets: ["bengali"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1917" },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getI18n();
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t("meta.title"), template: "%s · FarmFlows" },
    description: t("meta.description"),
    keywords: t("meta.keywords").split(",").map((k) => k.trim()),
    authors: [{ name: SITE_NAME }],
    creator: SITE_NAME,
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: t("meta.title"),
      description: t("meta.description"),
      locale: locale === "bn" ? "bn_BD" : "en_US",
      alternateLocale: locale === "bn" ? ["en_US"] : ["bn_BD"],
      url: "/",
    },
    twitter: { card: "summary_large_image", title: t("meta.title"), description: t("meta.description") },
    robots: { index: true, follow: true },
    // Search Console / Bing Webmaster ownership checks (set the codes in the environment).
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
      other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
        ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
        : undefined,
    },
    applicationName: "FarmFlows",
    appleWebApp: { capable: true, title: "FarmFlows", statusBarStyle: "default" },
    formatDetection: { telephone: false },
    icons: {
      icon: [
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
    },
  };
}

// Applies the saved theme before first paint so there is no light/dark flash.
const themeScript = `(function(){try{var m=localStorage.getItem('theme');var d=m==='dark'||((m===null||m==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.classList.toggle('dark',d);r.style.colorScheme=d?'dark':'light'}catch(e){}})()`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [{ locale }, optionRows] = await Promise.all([getI18n(), getOptionRows()]);

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} ${notoBengali.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <I18nProvider locale={locale} messages={messagesFor(locale)} optionRows={optionRows}>
          <ToastProvider>{children}</ToastProvider>
          <Suspense fallback={null}>
            <NavProgress />
          </Suspense>
          <Analytics />
          <PwaRegister />
        </I18nProvider>
      </body>
    </html>
  );
}
