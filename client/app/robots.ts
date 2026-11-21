import type { MetadataRoute } from "next";

/**
 * /robots.txt — crawling stays open as before (there was no robots.txt), plus a
 * pointer to the sitemap. Private pages are kept out of search with noindex
 * metadata instead of Disallow, so crawlers can still read that noindex.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://www.avatarindia.com/sitemap.xml",
  };
}
