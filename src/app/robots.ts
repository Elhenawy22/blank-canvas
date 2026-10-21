export const dynamic = "force-static";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    // Only advertise a sitemap once the production domain is confirmed.
    ...(siteUrl
      ? { sitemap: new URL("sitemap.xml", siteUrl).toString() }
      : {}),
  };
}
