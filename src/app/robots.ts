import type { MetadataRoute } from "next";
import { siteConfig } from "@/data/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/sketch-to-excel", "/api/"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
