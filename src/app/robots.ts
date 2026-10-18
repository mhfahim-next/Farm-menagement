import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/blog", "/contact", "/terms", "/privacy", "/login", "/signup", "/doctor/signup"],
        // Private app areas and endpoints are never indexed.
        disallow: ["/dashboard", "/admin", "/doctor", "/onboarding", "/invites", "/suspended", "/auth", "/api", "/offline"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
