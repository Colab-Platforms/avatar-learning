import Link from "next/link";
import ReactMarkdown, { type Components } from "react-markdown";
import { isExternalHref, normalizeHref, remarkInsightLinks } from "@/lib/insightLinks";
import styles from "./insightLinks.module.css";

const TEXT = "#c4cad2";
const MUTED = "#a3abb5";

const h2Style: React.CSSProperties = {
  margin: "clamp(36px,5vw,52px) 0 0",
  fontSize: "clamp(24px,3vw,32px)",
  lineHeight: 1.2,
  letterSpacing: "-0.03em",
  fontWeight: 600,
  color: "#f4f6f8",
};
const h3Style: React.CSSProperties = { margin: "28px 0 0", fontSize: 20, lineHeight: 1.3, fontWeight: 600, color: "#f4f6f8" };
const pStyle: React.CSSProperties = { margin: "16px 0 0", fontSize: 17, lineHeight: 1.75, color: TEXT };
const listStyle: React.CSSProperties = {
  margin: "16px 0 0",
  paddingLeft: 22,
  fontSize: 17,
  lineHeight: 1.75,
  color: TEXT,
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const components: Components = {
  // Source articles use `###` for every section heading; the page title is the only <h1>.
  h1: ({ children }) => <h2 style={h2Style}>{children}</h2>,
  h2: ({ children }) => <h2 style={h2Style}>{children}</h2>,
  h3: ({ children }) => <h2 style={h2Style}>{children}</h2>,
  h4: ({ children }) => <h3 style={h3Style}>{children}</h3>,
  p: ({ children }) => <p style={pStyle}>{children}</p>,
  ul: ({ children }) => <ul style={listStyle}>{children}</ul>,
  ol: ({ children }) => <ol style={listStyle}>{children}</ol>,
  li: ({ children }) => <li style={{ paddingLeft: 4 }}>{children}</li>,
  strong: ({ children }) => <strong style={{ color: "#f4f6f8", fontWeight: 600 }}>{children}</strong>,
  em: ({ children }) => <em style={{ color: MUTED }}>{children}</em>,
  hr: () => <hr style={{ border: 0, borderTop: "1px solid rgba(255,255,255,.08)", margin: "32px 0" }} />,
  a: ({ href: rawHref, children }) => {
    // Internal links stay in the same tab (client-side navigation); external ones open a new tab safely.
    const href = normalizeHref(rawHref);
    if (!href) return <>{children}</>;
    if (isExternalHref(href)) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={styles.link}>
          {children}
          <span className={styles.sr}> (opens in a new tab)</span>
        </a>
      );
    }
    return (
      <Link href={href} className={styles.link}>
        {children}
      </Link>
    );
  },
};

/**
 * Renders supplied article markdown (headings, paragraphs, lists, bold/italic, links) in the dark theme.
 * Pass the same `used` set (see seedUsedTerms) and `slug` for every block of one article so each keyword
 * is auto-linked only once per article.
 */
export function InsightMarkdown({ children, used, slug }: { children: string; used?: Set<string>; slug?: string }) {
  const plugins = used && slug ? [[remarkInsightLinks, { used, selfSlug: slug }] as [typeof remarkInsightLinks, { used: Set<string>; selfSlug: string }]] : [];
  return (
    <ReactMarkdown components={components} remarkPlugins={plugins}>
      {children}
    </ReactMarkdown>
  );
}
