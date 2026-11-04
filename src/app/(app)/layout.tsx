import { RootDocument, rootMetadata, rootViewport } from "@/components/root-document";

// Signed-in app (dashboard, admin, vet console…): the language comes from the
// saved cookie, as before.
export const viewport = rootViewport;
export const generateMetadata = rootMetadata;

export default function AppRootLayout({ children }: { children: React.ReactNode }) {
  return <RootDocument>{children}</RootDocument>;
}
