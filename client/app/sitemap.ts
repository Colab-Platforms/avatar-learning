import type { MetadataRoute } from "next";
import { getAllInsights } from "@/lib/insights";
import { BLOG_ARTICLES } from "@/data/blogData";
import { SITE_URL } from "@/lib/seo";

/**
 * /sitemap.xml — public, indexable pages on the primary domain (www), using the same
 * clean URLs as each page's canonical tag. The AI Adoption Ecosystem (/) is the primary
 * brand site; Avatar Learning pages are listed under their own routes. Left out on purpose:
 * noindex pages (sign-in, account, dashboards, purchase steps, thank-you — see next.config.ts
 * headers), redirects (/adoption/about, /insights, /account, /marketplace), and the
 * /adoption/privacy-policy and /adoption/terms-and-conditions copies, whose canonical is the
 * original /privacy-policy and /terms-and-conditions. Course detail pages come from the API
 * and are not listed (UNVERIFIED which courses are public at build time).
 */
type Entry = MetadataRoute.Sitemap[number];
const page = (path: string, changeFrequency: Entry["changeFrequency"], priority: number): Entry => ({
  url: `${SITE_URL}${path}`,
  changeFrequency,
  priority,
});

export default function sitemap(): MetadataRoute.Sitemap {
  const adoption: MetadataRoute.Sitemap = [
    page("/", "weekly", 1),
    page("/tools", "monthly", 0.9),
    page("/about", "monthly", 0.8),
    page("/blogs", "weekly", 0.8),
    page("/faq", "monthly", 0.7),
    page("/book-demo", "yearly", 0.6),
    ...getAllInsights().map((a) => page(`/blogs/${a.slug}`, "monthly", 0.6)),
  ];
  const company: MetadataRoute.Sitemap = [
    page("/investors", "monthly", 0.6),
    page("/investors/board-of-directors", "yearly", 0.4),
    page("/contact", "yearly", 0.5),
    page("/privacy-policy", "yearly", 0.3),
    page("/terms-and-conditions", "yearly", 0.3),
  ];
  const learning: MetadataRoute.Sitemap = [
    page("/learning", "weekly", 0.8),
    page("/learning/about", "monthly", 0.5),
    page("/courses", "weekly", 0.7),
    page("/direct2hire", "weekly", 0.7),
    page("/direct2hire/assessment-counselling", "monthly", 0.5),
    page("/partners", "monthly", 0.5),
    page("/webinar", "weekly", 0.5),
    page("/internships", "monthly", 0.4),
    page("/quiz", "monthly", 0.4),
    page("/blog", "weekly", 0.5),
    ...BLOG_ARTICLES.map((a) => page(`/blog/${a.slug}`, "monthly", 0.4)),
  ];
  return [...adoption, ...company, ...learning];
}
