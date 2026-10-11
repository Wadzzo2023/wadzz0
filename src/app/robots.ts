import type { MetadataRoute } from "next";

import { env } from "~/env";

/** Public pages are crawlable; personal and API routes aren't. */
export default function robots(): MetadataRoute.Robots {
  const base = env.NEXT_PUBLIC_URL.replace(/\/$/, "");
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/wallet", "/activity", "/notifications", "/settings", "/collection", "/search", "/fans/"] },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
