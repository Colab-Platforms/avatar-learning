import ReactMarkdown, { type Components } from "react-markdown";

const TEXT = "#c4cad2";
const MUTED = "#a3abb5";
const CYAN = "#8fe9f2";

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
  a: ({ href, children }) => {
    const external = !!href && /^https?:\/\//.test(href);
    return (
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        style={{ color: CYAN, textDecoration: "underline", textUnderlineOffset: 3, textDecorationColor: "rgba(143,233,242,.4)" }}
      >
        {children}
      </a>
    );
  },
};

/** Renders supplied article markdown verbatim (headings, paragraphs, lists, bold/italic, links) in the dark theme. */
export function InsightMarkdown({ children }: { children: string }) {
  return <ReactMarkdown components={components}>{children}</ReactMarkdown>;
}
