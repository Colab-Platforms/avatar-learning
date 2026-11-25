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
    p: "AI-READY TALENT",
    t: "Get AI-trained people for your team",
    d: "Get skilled, AI-trained professionals who are ready to contribute from day one.",
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
    name: "Script Automation",
    plain: "Workflow automation",
    slug: "script",
    desc: "Automate the repetitive steps in your daily work. Set a trigger once, and messages, task assignments and follow-ups run on their own, so your team can focus on the work that matters.",
    cta: "Ask about Script Automation",
    bullets: ["Automated workflows", "Instant follow-ups", "Fewer manual tasks"],
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
    name: "Recruitment CRM",
    plain: "Hiring pipeline",
    slug: "recruitment",
    desc: "Track every candidate from application to offer in one pipeline. Schedule interviews, share feedback and see where each opening stands without chasing emails.",
    cta: "Ask about Recruitment CRM",
    bullets: ["Candidate tracking", "Interview scheduling", "Hiring dashboards"],
  },
  {
    name: "HRMS",
    plain: "HR & attendance",
    slug: "hrms",
    desc: "Manage attendance, leave and employee records in one place. Staff check in from their phones, managers approve leave in a tap and payroll gets accurate numbers.",
    cta: "Ask about HRMS",
    bullets: ["Attendance tracking", "Leave approvals", "Employee records"],
  },
  {
    name: "IMS",
    plain: "Inventory management",
    slug: "inventory",
    desc: "See stock levels across every location in real time. Get alerts before items run out, and know exactly what to reorder and when.",
    cta: "Ask about IMS",
    bullets: ["Live stock levels", "Low-stock alerts", "Reorder planning"],
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
    // Not a product name: shown as-is, so the Marketing team chip stays "Content writing".
    products: ["Content writing", "LMS"],
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

/** One card in the Blogs section. Built from the markdown articles in client/content/insights (see lib/insights.ts). */
export interface InsightPost {
  slug: string;
  k: "case" | "blog";
  type: string;
  t: string;
  ex: string;
  meta: string;
  art: string;
  image?: string;
  featured?: boolean;
}

/** Homepage "About Avatar AI" section: heading (word-by-word scroll reveal) and subtitle. */
export const ABOUT_TEXT = "Grow Your Business Smarter with AI";
export const ABOUT_SUBTITLE = "From everyday operations to business growth, discover what AI can do for your business.";

export interface Pillar {
  n: string;
  t: string;
  d: string;
}

export const PILLARS: Pillar[] = [
  { n: "01", t: "Save Time", d: "Automate repetitive tasks and focus on business growth." },
  { n: "02", t: "Reduce Costs", d: "Minimize manual work and improve operational efficiency." },
  { n: "03", t: "Boost Productivity", d: "Empower your team to accomplish more with smarter tools." },
  { n: "04", t: "Grow Smarter", d: "Use business insights and automation to scale confidently." },
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
  { href: "/tools", label: "Tools" },
  // Temporarily hidden from the navbar (desktop + mobile menu). The homepage
  // sections (#how, #who) are unchanged; uncomment to bring the tabs back.
  // { href: "#how", label: "How it works" },
  // { href: "#who", label: "Who it's for" },
  { href: "/about", label: "About" },
  { href: "/blogs", label: "Blogs" },
  { href: "/faq", label: "FAQ" },
  { href: "/investors", label: "Investors" },
];

export const CONTACT = {
  email: "adoption@avatarindia.com",
  phone: "+91 89768 30779",
  whatsapp: "+91 91367 74304",
};

/** Official corporate details shown in the footer. */
export const COMPANY = {
  name: "AVATAR Industries Limited",
  formerly: "(Formerly known as ASL INDUSTRIES LIMITED)",
  cin: "L62099MH1992PLC464238",
  registeredOffice: "NESCO IT Park, 10th Floor, Building 4, Goregaon East, Mumbai, Maharashtra, India – 400063.",
};

export const FOOTER_PRODUCTS = [
  "CRM – Sales & Customer Management",
  "HRMS – Human Resource Management",
  "OMS – Order Management",
  "IMS – Inventory Management",
  "Recruitment CRM",
  "Script Automation",
];

export const FOOTER_COMPANY = [
  { label: "About Us", href: "/about" },
  { label: "Our Solutions", href: "/tools" },
  { label: "How It Works", href: "/#how" },
  { label: "Blogs", href: "/blogs" },
  { label: "Investors", href: "/investors" },
  { label: "Contact Us", href: "/#contact" },
];

/** Social links for the AI Adoption (home) page footer only. The learning
 * pages' footer keeps its own links in data/navigation.ts. */
export const ADOPTION_SOCIAL_LINKS = [
  { platform: "instagram", label: "Instagram", href: "https://www.instagram.com/avataraiadoption/" },
  { platform: "x", label: "X (Twitter)", href: "https://x.com/avataradoption" },
  { platform: "youtube", label: "YouTube", href: "https://www.youtube.com/@Avataraiadoption" },
  { platform: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/in/avatar-ai-1b8859450/" },
] as const;
