import "server-only";
import fs from "node:fs";
import path from "node:path";
import { INSIGHT_REGISTRY, type InsightCategory } from "@/content/insights/registry";
import type { InsightPost } from "@/components/ai-ecosystem/data";

const CONTENT_DIR = path.join(process.cwd(), "content", "insights");
const WORDS_PER_MINUTE = 200;

export const CATEGORY_LABEL: Record<InsightCategory, string> = {
  blog: "Blog",
  case: "Case study",
};

export interface InsightArticle {
  slug: string;
  category: InsightCategory;
  categoryLabel: string;
  title: string;
  /** First paragraph of the supplied Overview, used as the card/SEO description. */
  excerpt: string;
  /** Full supplied Overview section (markdown). */
  overview: string;
  /** Full supplied "Full Info" section (markdown) without its duplicate H1 title. */
  body: string;
  readingMinutes: number;
  art: string;
  featured: boolean;
}

/** Splits `## Title` / `## Overview` / `## Full Info` sections out of an article file. */
function parseArticleFile(raw: string) {
  const text = raw.replace(/\r\n/g, "\n");
  const grab = (name: string) => {
    const re = new RegExp(`^## ${name}\\s*\\n([\\s\\S]*?)(?=^## (?:Title|Overview|Full Info)\\s*$|(?![\\s\\S]))`, "m");
    return re.exec(text)?.[1].trim() ?? "";
  };
  // Some source titles are wrapped in **bold** markers; the title is plain text everywhere it is shown.
  const title = grab("Title").replace(/^\*\*([\s\S]*)\*\*$/, "$1").trim();
  const overview = grab("Overview").replace(/\n+---\s*$/, "").trim();
  // Drop the leading "# Title" line in Full Info: the page already renders the title once.
  const body = grab("Full Info").replace(/^# .*\n+/, "").trim();
  return { title, overview, body };
}

const stripMarkdown = (s: string) =>
  s
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();

function loadArticle(entry: (typeof INSIGHT_REGISTRY)[number]): InsightArticle {
  const raw = fs.readFileSync(path.join(CONTENT_DIR, `${entry.slug}.md`), "utf8");
  const { title, overview, body } = parseArticleFile(raw);
  if (!title || !overview || !body) {
    throw new Error(`Insight "${entry.slug}" is missing a Title, Overview or Full Info section.`);
  }
  const words = stripMarkdown(`${overview} ${body}`).split(" ").length;
  return {
    slug: entry.slug,
    category: entry.category,
    categoryLabel: CATEGORY_LABEL[entry.category],
    title,
    excerpt: stripMarkdown(overview.split(/\n\s*\n/)[0]),
    overview,
    body,
    readingMinutes: Math.max(1, Math.ceil(words / WORDS_PER_MINUTE)),
    art: entry.art,
    featured: !!entry.featured,
  };
}

export function getAllInsights(): InsightArticle[] {
  return INSIGHT_REGISTRY.map(loadArticle);
}

export function getInsightBySlug(slug: string): InsightArticle | undefined {
  const entry = INSIGHT_REGISTRY.find((e) => e.slug === slug);
  return entry ? loadArticle(entry) : undefined;
}

/** Shape consumed by the (client-side) Insights section. */
export function getInsightPosts(): InsightPost[] {
  return getAllInsights().map((a) => ({
    slug: a.slug,
    k: a.category,
    type: a.categoryLabel,
    t: a.title,
    ex: a.excerpt,
    meta: `${a.readingMinutes} min read`,
    art: a.art,
    featured: a.featured,
  }));
}
