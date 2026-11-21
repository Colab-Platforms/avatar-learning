import type { Root, RootContent, Text, Link } from "mdast";
import config from "@/content/insights/links.json";

export interface KeywordLink {
  term: string;
  href: string;
  caseSensitive?: boolean;
}

export const KEYWORDS = config.keywords as KeywordLink[];
export const RELATED = config.related as Record<string, string[]>;
export const CTA = config.cta as Record<string, { heading: string; body: string; primaryLabel: string; secondaryLabel: string }>;

/** Every in-article hyperlink and CTA leads to the demo form on the home page. */
export const DEMO_HREF = "/#demo-form";

const SITE_HOSTS = /^https?:\/\/(?:www\.)?avatarindia\.com/i;

/**
 * Every absolute avatarindia.com link in the supplied articles is pointed at the demo form (DEMO_HREF).
 */
export function normalizeHref(href: string | undefined): string | undefined {
  if (!href) return href;
  if (!SITE_HOSTS.test(href)) return href;
  return DEMO_HREF;
}

export const isExternalHref = (href: string | undefined) => !!href && /^(https?:)?\/\//i.test(href);

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const keyOf = (term: string) => term.toLowerCase();

/** Terms already linked by hand in the supplied markdown, so the auto-linker never repeats them. */
export function seedUsedTerms(...markdown: string[]): Set<string> {
  const used = new Set<string>();
  const re = /\[([^\]]+)\]\([^)]*\)/g;
  for (const md of markdown) {
    for (const m of md.matchAll(re)) used.add(keyOf(m[1].replace(/[*_`]/g, "").trim()));
  }
  return used;
}

const SKIP = new Set(["heading", "link", "linkReference", "code", "inlineCode", "html"]);
const BLOCKS = new Set(["paragraph"]);

/**
 * remark plugin: links the first mention of each configured keyword in an article (shared `used` set
 * across the overview and body). Headings, existing links and code are never touched, at most one link
 * is added per paragraph, and an article never links to itself.
 */
export function remarkInsightLinks(opts: { used: Set<string>; selfSlug: string }) {
  const { used, selfSlug } = opts;
  const keywords = KEYWORDS.filter((k) => k.href !== `/insights/${selfSlug}`);

  const linkInParagraph = (children: RootContent[]): RootContent[] => {
    let added = false;
    const walk = (nodes: RootContent[]): RootContent[] => {
      const out: RootContent[] = [];
      for (const node of nodes) {
        if (SKIP.has(node.type)) {
          out.push(node);
          continue;
        }
        if (node.type !== "text" || added) {
          if ("children" in node && !added) (node as { children: RootContent[] }).children = walk((node as { children: RootContent[] }).children);
          out.push(node);
          continue;
        }
        let rest: string = (node as Text).value;
        while (rest && !added) {
          let best: { index: number; len: number; kw: KeywordLink } | null = null;
          for (const kw of keywords) {
            if (used.has(keyOf(kw.term))) continue;
            const re = new RegExp(`(?<![\\w-])${escapeRe(kw.term)}(?![\\w-])`, kw.caseSensitive ? "" : "i");
            const m = re.exec(rest);
            if (m && (!best || m.index < best.index)) best = { index: m.index, len: m[0].length, kw };
          }
          if (!best) break;
          if (best.index > 0) out.push({ type: "text", value: rest.slice(0, best.index) });
          const link: Link = {
            type: "link",
            url: best.kw.href,
            children: [{ type: "text", value: rest.slice(best.index, best.index + best.len) }],
          };
          out.push(link);
          used.add(keyOf(best.kw.term));
          added = true;
          rest = rest.slice(best.index + best.len);
        }
        if (rest) out.push({ type: "text", value: rest });
      }
      return out;
    };
    return walk(children);
  };

  const visit = (node: Root | RootContent) => {
    if (!("children" in node) || SKIP.has(node.type)) return;
    const parent = node as { children: RootContent[]; type: string };
    if (BLOCKS.has(parent.type)) {
      parent.children = linkInParagraph(parent.children);
      return;
    }
    for (const child of parent.children) visit(child);
  };

  return (tree: Root) => visit(tree);
}
