import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private or utility areas: never useful in search results.
        disallow: ["/admin", "/dashboard", "/api/", "/auth/", "/login", "/reset-password", "/m/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
