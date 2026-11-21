import Link from "next/link";
import { CTA, DEMO_HREF, RELATED } from "@/lib/insightLinks";
import type { InsightArticle } from "@/lib/insights";
import styles from "./insightLinks.module.css";

const mono: React.CSSProperties = { fontFamily: "var(--font-geist-mono),monospace", fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase" };

/** End-of-article call to action + related articles. Config lives in content/insights/links.json. */
export function InsightArticleFooter({ slug, all }: { slug: string; all: InsightArticle[] }) {
  const cta = CTA[slug];
  const related = (RELATED[slug] ?? []).map((s) => all.find((a) => a.slug === s)).filter((a): a is InsightArticle => !!a);

  return (
    <>
      {cta && (
        <aside
          aria-labelledby="insight-cta-heading"
          style={{ marginTop: 48, padding: "clamp(22px,3vw,32px)", borderRadius: 20, border: "1px solid rgba(111,227,239,.25)", background: "radial-gradient(circle at 85% 0%,rgba(111,227,239,.10),transparent 55%),rgba(255,255,255,.02)" }}
        >
          <h2 id="insight-cta-heading" style={{ margin: 0, fontSize: "clamp(22px,2.6vw,28px)", lineHeight: 1.2, letterSpacing: "-0.03em", fontWeight: 600, color: "#f4f6f8" }}>
            {cta.heading}
          </h2>
          <p style={{ margin: "10px 0 0", fontSize: 16, lineHeight: 1.6, color: "#a3abb5" }}>{cta.body}</p>
          <div style={{ marginTop: 20, display: "flex", flexWrap: "wrap", gap: 12 }}>
            <Link href={DEMO_HREF} className={`${styles.btn} ${styles.btnPrimary}`}>
              {cta.primaryLabel}
            </Link>
            <Link href={DEMO_HREF} className={`${styles.btn} ${styles.btnGhost}`}>
              {cta.secondaryLabel}
            </Link>
          </div>
        </aside>
      )}

      {related.length > 0 && (
        <section aria-labelledby="related-articles-heading" style={{ marginTop: 48 }}>
          <h2 id="related-articles-heading" style={{ margin: 0, fontSize: 22, lineHeight: 1.2, letterSpacing: "-0.03em", fontWeight: 600, color: "#f4f6f8" }}>
            Related Articles
          </h2>
          <ul className={styles.related}>
            {related.map((a) => (
              <li key={a.slug} style={{ display: "flex" }}>
                <Link href={`/blogs/${a.slug}`} className={styles.card} style={{ width: "100%" }}>
                  {a.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.image} alt="" loading="lazy" style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }} />
                  )}
                  <span style={{ display: "flex", flexDirection: "column", gap: 8, padding: "14px 16px 16px" }}>
                    <span style={{ ...mono, color: "#98a1ac" }}>
                      {a.categoryLabel} &middot; {a.readingMinutes} min read
                    </span>
                    <span className={styles.cardTitle}>{a.title}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
