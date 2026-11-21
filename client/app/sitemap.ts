import type { MetadataRoute } from "next";
import { getAllInsights } from "@/lib/insights";

/**
 * /sitemap.xml — public, indexable AI Adoption pages on the primary domain (www),
 * using the same clean URLs as each page's canonical tag. Private pages (sign-in,
 * account, thank-you) are noindex and left out. Avatar Learning pages can be added
 * here by their owners.
 */
const SITE_URL = "https://www.avatarindia.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/tools`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/adoption/about`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/blogs`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/faq`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/book-demo`, changeFrequency: "yearly", priority: 0.6 },
  ];
  const articles: MetadataRoute.Sitemap = getAllInsights().map((a) => ({
    url: `${SITE_URL}/blogs/${a.slug}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));
  return [...pages, ...articles];
}
