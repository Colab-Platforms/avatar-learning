// Content model for the AI Adoption Ecosystem page.
// Mirrors the Avatar-built reference design 1:1 (avataraiadoptionbeta.netlify.app).

export const COLORS = {
  bg: "#07080b",
  ink: "#f4f6f8",
  sub: "#a3abb5",
  dim: "#8a939e",
  mono: "#98a1ac",
  cyan: "#8fe9f2",
  cyanBright: "#e9fdff",
  cyanLine: "#6fe3ef",
  violet: "#6b7cff",
  card: "#0c0e13",
};

export interface GapCard {
  n: string;
  p: string;
  t: string;
  d: string;
  theme: "violet" | "dark" | "light" | "teal";
}

export const GAP_CARDS: GapCard[] = [
  {
    n: "01",
    p: "Not sure where to start",
    t: "A clear first step for your business",
    d: "We study how your business runs and pick the one tool that will help you the most.",
    theme: "violet",
  },
  {
    n: "02",
    p: "Teams lack AI skills",
    t: "Your whole team, AI-trained",
    d: "Hands-on training so every person on your team can use each tool with confidence.",
    theme: "dark",
  },
  {
    n: "03",
    p: "Generic tools don’t fit",
    t: "Tools that fit your business",
    d: "Ready-made CRM, OMS, AI Content and LMS set up for how you work, or built for you.",
    theme: "light",
  },
  {
    n: "04",
    p: "No help after launch",
    t: "Support that stays with you",
    d: "We stay on after launch to fix issues, train new staff and add new tools as you grow.",
    theme: "teal",
  },
];

export interface BarrierStat {
  v: number;
  t: string;
  d: string;
}

export const BARRIER_STATS: BarrierStat[] = [
  { v: 70, t: "Lack a clear AI strategy", d: "of businesses have no defined roadmap for AI adoption." },
  { v: 60, t: "Struggle to find skilled talent", d: "of companies face a shortage of AI-skilled professionals." },
  { v: 63, t: "Find it complex to implement", d: "face challenges in integrating AI with existing systems." },
  { v: 50, t: "Cite high cost and uncertainty", d: "of businesses are unsure about ROI and costs." },
];

export interface Product {
  name: string;
  plain: string;
  slug: string;
  tag?: string;
  desc: string;
  cta: string;
  bullets: string[];
}

export const PRODUCTS: Product[] = [
  {
    name: "CRM",
    plain: "Sales pipeline",
    slug: "crm",
    desc: "Keep every lead, customer and deal in one place. Your team sees who to call next, and follow-ups go out on time without anyone chasing them.",
    cta: "Ask about CRM",
    bullets: ["Lead tracking", "Automated follow-ups", "Team dashboards"],
  },
  {
    name: "OMS",
    plain: "Order tracking",
    slug: "orders",
    desc: "Track every order from purchase to delivery on one dashboard. Stock updates on its own, so you always know what is ready to ship and what needs restocking.",
    cta: "Ask about OMS",
    bullets: ["Order status", "Inventory updates", "Delivery status"],
  },
  {
    name: "AI Content",
    plain: "Content writing",
    slug: "content",
    desc: "Create blog posts, social captions and product copy in minutes. Set your brand tone once, and every draft sounds like you before it reaches your team for approval.",
    cta: "Ask about AI Content",
    bullets: ["Blog and social posts", "Brand tone control", "Faster approvals"],
  },
  {
    name: "LMS",
    plain: "Team training",
    slug: "learning",
    desc: "Give your team ready-made AI courses they can take at their own pace. Track progress, award certificates and add new lessons as your tools and needs grow.",
    cta: "Ask about LMS",
    bullets: ["Ready-made AI courses", "Progress tracking", "Certificates"],
  },
  {
    name: "Custom",
    plain: "Custom tools",
    slug: "custom",
    tag: "Built for you",
    desc: "Tell us how your business runs and we will build a tool around it. We handle the design, connect it to your existing systems and stay on to support it.",
    cta: "Plan a custom build",
    bullets: ["Needs assessment", "Custom build", "Ongoing support"],
  },
];

export interface Role {
  name: string;
  q: string;
  d: string;
  products: string[];
  cta: string;
  chips: string[];
}

export const ROLES: Role[] = [
  {
    name: "Growing business",
    q: "Growing fast, but still running on spreadsheets?",
    d: "Bring orders, customers and sales into one connected system. Reports build themselves and your team stops copying data between sheets.",
    products: ["CRM", "OMS"],
    cta: "Plan my setup",
    chips: ["Orders", "Customers", "Sales", "Reports"],
  },
  {
    name: "Sales team",
    q: "Leads slipping through the cracks?",
    d: "Keep every lead in one clear pipeline. Avatar reminds your team when to follow up, so no enquiry goes cold and managers can see what is closing this week.",
    products: ["CRM", "LMS"],
    cta: "Fix my follow-ups",
    chips: ["Leads", "Reminders", "Pipeline", "Dashboards"],
  },
  {
    name: "Marketing team",
    q: "Need more content, without more people?",
    d: "Create blog posts, social captions and product copy in a fraction of the time. Every draft follows your brand tone, so your team spends less time writing and more time on ideas.",
    products: ["AI Content", "LMS"],
    cta: "See a content demo",
    chips: ["Posts", "Blogs", "Tone", "Reviews"],
  },
  {
    name: "Unique needs",
    q: "Don’t see what you need?",
    d: "Tell us how your business works and where it slows down. We’ll design a tool around your process, connect it to what you already use and support it after launch.",
    products: ["Custom"],
    cta: "Tell us what you need",
    chips: ["Assess", "Build", "Integrate", "Support"],
  },
];

export interface FaqItem {
  q: string;
  a: string;
}

export const FAQS: FaqItem[] = [
  {
    q: "Can we start with just one product?",
    a: "Yes. Most clients start with the one tool that solves their biggest problem today, such as CRM or AI Content Writing. Once your team is comfortable, you can add more tools and they will connect with what you already use.",
  },
  {
    q: "How long does setup take?",
    a: "It depends on the tools you choose and how your business works. A single ready-made tool can usually be set up within a few weeks, while custom solutions take longer. We share a clear timeline after our first conversation.",
  },
  {
    q: "Do you train our team?",
    a: "Yes. Every setup includes hands-on training, so your team knows how to use the tools in their daily work. We can also offer ongoing learning through our LMS as your needs grow.",
  },
  {
    q: "Is our data secure?",
    a: "Yes. Your data stays private and is only used to run your tools. We follow secure practices for storing and accessing information, and we can walk your team through the details before you start.",
  },
];

export interface InsightPost {
  k: "case" | "blog";
  type: string;
  t: string;
  ex: string;
  meta: string;
  art: string;
}

export const INSIGHT_POSTS: InsightPost[] = [
  {
    k: "case",
    type: "Case study",
    t: "How a textile distributor stopped losing leads with CRM",
    ex: "Enquiries came in through calls, WhatsApp and the website, and many were never followed up. One shared pipeline changed that.",
    meta: "5 min read",
    art: "radial-gradient(circle at 72% 28%,rgba(111,227,239,.55),transparent 45%),radial-gradient(circle at 22% 82%,rgba(107,124,255,.65),transparent 50%),#0c0e13",
  },
  {
    k: "blog",
    type: "Blog",
    t: "Where to start with AI in a small business",
    ex: "A simple way to find the one process where AI will save your team the most time, before you spend on any tool.",
    meta: "6 min read",
    art: "radial-gradient(circle at 30% 30%,rgba(181,189,255,.55),transparent 50%),linear-gradient(160deg,#1c1f5e,#0b0d12)",
  },
  {
    k: "case",
    type: "Case study",
    t: "Bringing orders from three channels onto one dashboard",
    ex: "A growing D2C brand was tracking orders across spreadsheets and marketplaces. Here is how they moved to a single view.",
    meta: "4 min read",
    art: "radial-gradient(circle at 50% 115%,rgba(111,227,239,.65),transparent 60%),#0b0d12",
  },
  {
    k: "blog",
    type: "Blog",
    t: "Five everyday sales tasks you can hand to AI",
    ex: "From follow-up reminders to call notes, small tasks that add up to hours saved every week.",
    meta: "4 min read",
    art: "radial-gradient(circle at 80% 20%,rgba(107,124,255,.55),transparent 50%),radial-gradient(circle at 20% 90%,rgba(111,227,239,.4),transparent 50%),#10131a",
  },
  {
    k: "case",
    type: "Case study",
    t: "Getting a sales team confident with AI tools",
    ex: "How hands-on training and short LMS courses helped a team move from curious to comfortable.",
    meta: "6 min read",
    art: "conic-gradient(from 210deg at 60% 60%,#0c0e13,rgba(111,227,239,.45),#2b2f8f,#0c0e13)",
  },
  {
    k: "blog",
    type: "Blog",
    t: "Writing on-brand content with AI without losing your voice",
    ex: "Set your tone once and keep every post, caption and product description sounding like you.",
    meta: "5 min read",
    art: "radial-gradient(circle at 25% 25%,rgba(111,227,239,.45),transparent 45%),linear-gradient(200deg,#2c3196,#0b0d12 70%)",
  },
];

export const ABOUT_TEXT =
  "Avatar is a complete AI partner. Beyond software, we help businesses learn about AI, find the right talent and put solutions into practice.";

export interface Pillar {
  n: string;
  t: string;
  d: string;
}

export const PILLARS: Pillar[] = [
  { n: "01", t: "Learn", d: "AI courses for your whole team" },
  { n: "02", t: "Talent", d: "Skilled AI experts on demand" },
  { n: "03", t: "Solutions", d: "Ready-made and custom tools" },
  { n: "04", t: "Implementation", d: "Setup and ongoing support" },
];

export interface Step {
  n: string;
  t: string;
  d: string;
}

export const STEPS: Step[] = [
  {
    n: "01",
    t: "Understand",
    d: "We study how your business works today and find where AI will save you the most time and effort.",
  },
  {
    n: "02",
    t: "Implement",
    d: "We set up the right tools, connect them to your existing systems and train your team to use them.",
  },
  {
    n: "03",
    t: "Scale",
    d: "We review results with you regularly and add new tools as your business grows.",
  },
];

export const HERO_PROMPTS: [string, string][] = [
  ["Follow up with yesterday's leads", "3 follow-ups drafted in CRM"],
  ["Which orders ship today?", "6 orders ready to ship in OMS"],
  ["Write a post for our Diwali sale", "Post drafted in AI Content"],
  ["Train my sales team on AI basics", "Course assigned in LMS"],
];

export const MARQUEE_ITEMS = [
  "Follow up every lead",
  "Track every order",
  "Write on-brand posts",
  "Train your team",
  "Automate reports",
  "Build custom tools",
  "Support after launch",
];

export const NAV_LINKS = [
  { href: "#products", label: "Products" },
  { href: "#how", label: "How it works" },
  { href: "#who", label: "Who it's for" },
  { href: "#about", label: "About" },
  { href: "#insights", label: "Insights" },
  { href: "#faq", label: "FAQ" },
];

export const CONTACT = {
  email: "business@avatarindia.com",
  phone: "+91 89768 30779",
  whatsapp: "+91 91367 74304",
};

export const FOOTER_PRODUCTS = [
  "Sales pipeline (CRM)",
  "Order tracking (OMS)",
  "Content writing (AI)",
  "Team training (LMS)",
  "Custom tools",
];

export const FOOTER_COMPANY = [
  { label: "About", href: "#about" },
  { label: "How it works", href: "#how" },
  { label: "Insights", href: "#insights" },
  { label: "Contact", href: "#contact" },
];
