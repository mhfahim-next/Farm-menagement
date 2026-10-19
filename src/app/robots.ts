import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/", "/blog", "/community", "/changelog", "/farm-management-software", "/contact", "/terms", "/privacy",
          "/login", "/signup", "/doctor/signup",
          // Search engines fetch these for the site icon in results.
          "/favicon.ico", "/favicon.svg", "/icons/", "/brand/",
        ],
        // Private app areas and endpoints are never indexed.
        disallow: ["/dashboard", "/admin", "/doctor", "/onboarding", "/invites", "/suspended", "/auth", "/api", "/offline"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
