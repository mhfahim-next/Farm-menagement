import { NotFoundPage, notFoundMetadata } from "@/components/not-found-page";
import { RootDocument } from "@/components/root-document";

// Addresses that match no page at all. The site has two root layouts (public
// pages and the signed-in app), so this one renders its own document.
export const generateMetadata = notFoundMetadata;

export default function GlobalNotFound() {
  return (
    <RootDocument>
      <NotFoundPage />
    </RootDocument>
  );
}
