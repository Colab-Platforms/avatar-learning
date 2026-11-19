// Validates internal links for the Insights articles. Run from client/: `npm run check:links`.
// Offline by design: internal routes are checked against the app/ folder, slugs against the registry,
// and #anchors against `id="..."` attributes in the page components. External links are only listed.
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const errors = [];
const warn = [];

const registry = read("content/insights/registry.ts");
const slugs = [...registry.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]);
const config = JSON.parse(read("content/insights/links.json"));

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
const sources = ["components", "app"].flatMap((d) => walk(path.join(root, d))).filter((f) => /\.tsx?$/.test(f)).map((f) => fs.readFileSync(f, "utf8")).join("\n");
const hasId = (id) => new RegExp(`id=["'{]+["']?${id}["']`).test(sources);

const SITE = /^https?:\/\/(?:www\.)?avatarindia\.com/i;
function normalize(href) {
  if (!SITE.test(href)) return href;
  return "/#demo-form";
}

function routeExists(p) {
  const segs = p.split("/").filter(Boolean);
  let dir = path.join(root, "app");
  const find = (d, rest) => {
    if (!rest.length) return fs.existsSync(path.join(d, "page.tsx"));
    const [head, ...tail] = rest;
    const entries = fs.readdirSync(d, { withFileTypes: true }).filter((e) => e.isDirectory());
    for (const e of entries) {
      if (/^\(.*\)$/.test(e.name)) { if (find(path.join(d, e.name), rest)) return true; continue; }
      if (e.name === head || /^\[[^\]]+\]$/.test(e.name)) { if (find(path.join(d, e.name), tail)) return true; }
    }
    return false;
  };
  return find(dir, segs);
}

function checkInternal(href, where) {
  const [pathAndQuery, hash] = href.split("#");
  const pathname = pathAndQuery.split("?")[0] || "/";
  const ins = pathname.match(/^\/insights\/([^/]+)$/);
  if (ins) { if (!slugs.includes(ins[1])) errors.push(`${where}: unknown article ${href}`); }
  else if (pathname !== "/" && !routeExists(pathname)) errors.push(`${where}: no page for route ${pathname}`);
  else if (pathname === "/" && !fs.existsSync(path.join(root, "app/page.tsx"))) errors.push(`${where}: no home page`);
  if (hash && pathname === "/" && !hasId(hash)) errors.push(`${where}: anchor #${hash} not found (no id="${hash}")`);
}

const GENERIC = /^(click here|here|read more|learn more|link|this)$/i;
const externals = new Set();
let articleLinks = 0;

for (const slug of slugs) {
  const file = `content/insights/${slug}.md`;
  if (!fs.existsSync(path.join(root, file))) { errors.push(`${file}: missing`); continue; }
  for (const m of read(file).matchAll(/\[([^\]]+)\]\(([^)]*)\)/g)) {
    articleLinks++;
    const [, text, raw] = m;
    const href = normalize(raw);
    if (GENERIC.test(text.trim())) errors.push(`${file}: generic anchor text "${text}"`);
    if (/^https?:\/\//i.test(href)) { externals.add(href); if (href.startsWith("http://")) warn.push(`${file}: insecure link ${href}`); }
    else if (href.startsWith("/") || href.startsWith("#")) checkInternal(href, file);
    else errors.push(`${file}: unsupported link ${raw}`);
  }
}

for (const k of config.keywords) {
  if (GENERIC.test(k.term)) errors.push(`links.json: generic keyword "${k.term}"`);
  checkInternal(k.href, `links.json keyword "${k.term}"`);
  const esc = k.term.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
  const re = new RegExp(String.raw`(?<![\w-])` + esc + String.raw`(?![\w-])`, k.caseSensitive ? "" : "i");
  const used = slugs.some((s) => re.test(read(`content/insights/${s}.md`)));
  if (!used) warn.push(`links.json: keyword "${k.term}" does not appear in any article`);
}
for (const s of slugs) {
  const rel = config.related[s];
  if (!rel || rel.length < 2) errors.push(`links.json: article ${s} needs related articles`);
  else for (const r of rel) { if (!slugs.includes(r)) errors.push(`links.json related[${s}]: unknown slug ${r}`); if (r === s) errors.push(`links.json related[${s}]: links to itself`); }
  if (!config.cta[s]) errors.push(`links.json: article ${s} has no cta`);
}
for (const s of [...Object.keys(config.related), ...Object.keys(config.cta)]) if (!slugs.includes(s)) errors.push(`links.json: unknown article key ${s}`);
for (const h of ["/#demo-form"]) checkInternal(h, "CTA target");

console.log(`Articles: ${slugs.length}, links in markdown: ${articleLinks}, external: ${externals.size ? [...externals].join(", ") : "none"}`);
warn.forEach((w) => console.log("WARN ", w));
errors.forEach((e) => console.log("ERROR", e));
console.log(errors.length ? `\n${errors.length} problem(s) found.` : "\nAll insight links OK.");
process.exit(errors.length ? 1 : 0);
