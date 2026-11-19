import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InsightsShell } from "@/components/ai-ecosystem/InsightsShell";
import { InsightMarkdown } from "@/components/ai-ecosystem/InsightMarkdown";
import { getAllInsights, getInsightBySlug } from "@/lib/insights";

// Only slugs from the registry exist; anything else is a 404 (works on direct load and refresh).
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllInsights().map((a) => ({ slug: a.slug }));
}

type Props = { params: Promise<{ slug: string }> };

const SITE_URL = "https://www.avatarindia.com";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getInsightBySlug(slug);
  if (!article) return {};
  const url = `${SITE_URL}/insights/${article.slug}`;
  return {
    title: `${article.title} | Avatar India`,
    description: article.excerpt,
    alternates: { canonical: url },
    openGraph: { type: "article", title: article.title, description: article.excerpt, url, siteName: "Avatar India" },
    twitter: { card: "summary", title: article.title, description: article.excerpt },
  };
}

const backLink: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  minHeight: 44,
  fontSize: 15,
  fontWeight: 500,
  color: "#8fe9f2",
};

export default async function InsightArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getInsightBySlug(slug);
  if (!article) notFound();

  return (
    <InsightsShell>
      <article style={{ maxWidth: 760, margin: "0 auto", padding: "clamp(32px,5vw,64px) 24px clamp(56px,7vw,96px)" }}>
        <Link href="/insights" style={backLink}>
          ← Back to Insights
        </Link>

        <header style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <span style={{ fontFamily: "var(--font-geist-mono),monospace", fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: "#8fe9f2" }}>
            {article.categoryLabel} &middot; {article.readingMinutes} min read
          </span>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(32px,4.6vw,52px)",
              lineHeight: 1.08,
              letterSpacing: "-0.04em",
              fontWeight: 600,
              textWrap: "balance",
              background: "linear-gradient(180deg,#fff 40%,#8e98a4)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {article.title}
          </h1>
        </header>

        <section
          aria-label="Overview"
          style={{ marginTop: 32, padding: "clamp(20px,3vw,28px)", borderRadius: 20, border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.02)" }}
        >
          <span style={{ fontFamily: "var(--font-geist-mono),monospace", fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: "#98a1ac" }}>
            Overview
          </span>
          <InsightMarkdown>{article.overview}</InsightMarkdown>
        </section>

        <div style={{ marginTop: 8 }}>
          <InsightMarkdown>{article.body}</InsightMarkdown>
        </div>

        <div style={{ marginTop: 48, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,.08)" }}>
          <Link href="/insights" style={backLink}>
            ← Back to Insights
          </Link>
        </div>
      </article>
    </InsightsShell>
  );
}
