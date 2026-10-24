// Content for /home. Sections below the hero follow the "Homepage Revamp
// (Desktop)" design; courses, testimonials and blog posts come from the
// site's existing data so they stay in sync with the rest of the site.

export const LA_NAV = [
  { label: "Ecosystem", href: "#ecosystem" },
  { label: "Learning", href: "/learning" },
  { label: "AI Tools", href: "/marketplace" },
  { label: "Services", href: "/" },
  { label: "About", href: "/about" },
];

export const LA_INVESTORS = { label: "For Investors", href: "/investors" };

// The three glass cards that sit on the hero artwork. Order and slot
// positions are fixed by the artwork (see .card1/.card2/.card3).
export const LA_HERO_CARDS = [
  {
    num: "01",
    icon: "book",
    title: ["Avatar", "Learning"],
    desc: ["Live, hands-on", "AI programs."],
    href: "#ecosystem",
  },
  {
    num: "02",
    icon: "team",
    title: ["AI Adoption", "Services"],
    desc: ["Setup, training and", "ongoing support."],
    href: "/",
  },
  {
    num: "03",
    icon: "tools",
    title: ["AI Tools &", "Solutions"],
    desc: ["Ready-made and", "custom AI tools."],
    href: "/marketplace",
  },
] as const;

export const LA_STRIP = [
  { num: "01", title: "Learn", sub: "Build AI skills" },
  { num: "02", title: "Adopt", sub: "Implement solutions" },
  { num: "03", title: "Access", sub: "Ready-made AI tools" },
  { num: "04", title: "Scale", sub: "Drive real impact" },
];

export const LA_TRUST = [
  { icon: "chart", title: "NSE-listed", sub: "Backed by an NSE-listed company" },
  { icon: "layers", title: "One integrated platform", sub: "Learn, hire, build and grow" },
  { icon: "spark", title: "AI-first platform", sub: "Built around the latest AI" },
];

export type PillarId = "learning" | "marketplace" | "trainers" | "adoption";

export const LA_PILLARS: {
  id: PillarId;
  num: string;
  title: string;
  sub: string;
  status: "live" | "soon";
}[] = [
  { id: "learning", num: "01", title: "Learning", sub: "Courses + placement", status: "live" },
  { id: "marketplace", num: "02", title: "Marketplace", sub: "AI tools store", status: "soon" },
  { id: "trainers", num: "03", title: "AI Trainer Community", sub: "Book a trainer", status: "soon" },
  { id: "adoption", num: "04", title: "AI Adoption Ecosystem", sub: "For businesses", status: "soon" },
];

export const LA_LEARNING_PANEL = {
  eyebrow: "Live · Flagship program",
  title: ["Learn AI, with", "a career path"],
  body: "Courses run inside Direct2Hire, with plans that carry different levels of career support.",
  points: ["Courses for every level", "Live sessions and real projects", "Career guidance built in"],
  cta: { label: "Go to Direct2Hire", href: "/direct2hire" },
};

// Panels for the pillars that haven't launched yet.
export const LA_SOON_PANELS: Record<
  Exclude<PillarId, "learning">,
  { title: string[]; body: string; points: string[]; cta: { label: string; href: string } }
> = {
  marketplace: {
    title: ["AI tools,", "in one store"],
    body: "A marketplace to discover, compare and start using the AI tools that fit your work.",
    points: ["Ready-made AI tools", "Compare before you commit", "Built for Indian businesses"],
    cta: { label: "Preview the Marketplace", href: "/marketplace" },
  },
  trainers: {
    title: ["Book an", "AI trainer"],
    body: "Bring an AI trainer to your team, college or institution for sessions on the tools you actually use.",
    points: ["Expert-led sessions", "For teams and institutions", "Topics matched to your needs"],
    cta: { label: "Talk to us", href: "/contact" },
  },
  adoption: {
    title: ["Put AI to work", "in your business"],
    body: "We find where AI saves you the most time, set up the right tools and train your team to use them.",
    points: ["Understand how you work today", "Implement and connect tools", "Review and scale as you grow"],
    cta: { label: "Explore AI adoption", href: "/" },
  },
};

// Sections 1–5 below use the exact wording of "website content.docx".

export const LA_ABOUT = {
  label: "Who We Are",
  heading: ["Building the", "AI-Powered Future."],
  body: [
    "Avatar India is building an integrated AI ecosystem that connects AI learning, business transformation, and technology solutions.",
    "We aim to make AI accessible, practical, and scalable for individuals and businesses. By bringing skills, implementation, and innovation together, we create pathways to participate in the evolving AI economy.",
  ],
  taglines: [
    "Empowering People. Transforming Businesses. Enabling Innovation.",
    "Empower. Transform. Evolve.",
    "Intelligence. Innovation. Impact.",
    "Empowering People. Enabling Progress. Shaping Tomorrow.",
  ],
};

export const LA_AUDIENCES = [
  {
    title: "Individuals",
    body: "Students and professionals who want AI skills and a job to go with them.",
    href: "/direct2hire",
  },
  {
    title: "Businesses",
    body: "Teams that want AI working inside their day-to-day operations.",
    href: "/",
  },
  {
    title: "Institutions",
    body: "Colleges and training bodies bringing AI programs to their students.",
    href: "/partners",
  },
];

export const LA_WHY = {
  heading: ["Why", "Avatar"],
  items: [
    {
      title: "One Integrated Ecosystem",
      body: [
        "We connect AI education, business implementation, and technology access within one broader ecosystem.",
        "This integrated approach creates opportunities for our verticals to complement one another and serve evolving market needs.",
      ],
    },
    {
      title: "Built Around Real Needs",
      body: [
        "We focus on practical AI applications that address real challenges faced by individuals and businesses.",
        "Our approach prioritises relevant skills, useful solutions, and meaningful business outcomes over technology for its own sake.",
      ],
    },
    {
      title: "Powered by Collaboration",
      body: [
        "We aim to bring together learners, businesses, developers, technology providers, and agency partners.",
        "This connected network can expand access to expertise, solutions, and new business opportunities.",
      ],
    },
    {
      title: "Designed for Growth",
      body: [
        "Our model spans AI education, business services, and digital technology platforms.",
        "These complementary verticals offer opportunities to expand across industries, customer segments, and partner-led distribution channels.",
      ],
    },
  ],
};

export const LA_VISION = {
  label: "Our Vision",
  heading: ["Making AI", "Work for Everyone."],
  body: [
    "We envision a future where AI skills, tools, and solutions are accessible to individuals and businesses of every size.",
    "Our mission is to build an interconnected ecosystem that empowers people, transforms businesses, and accelerates innovation through practical AI adoption.",
  ],
};

export const LA_CONTACT_COPY = {
  label: "Contact Us",
  heading: ["Let's Build", "What's Next."],
  body: [
    "The future of AI will be shaped by collaboration, innovation, and practical implementation. At Avatar India, we welcome opportunities to work with businesses, investors, and technology partners who share this vision.",
    "Connect with us to explore AI solutions, strategic partnerships, and opportunities to build within the evolving AI ecosystem.",
  ],
};

export const LA_CONTACT = [
  { icon: "mail", label: "Email", value: "business@avatarindia.com", href: "mailto:business@avatarindia.com" },
  { icon: "phone", label: "Phone", value: "+91 89768 30779", href: "tel:+918976830779" },
  { icon: "chat", label: "WhatsApp", value: "+91 91367 74304", href: "https://wa.me/919136774304" },
];

export const LA_FAQS = [
  {
    q: "Do I need a technical background to start?",
    a: "No. Direct2Hire starts with an evaluation and a counseling call, then puts you on a track that matches your current level — including tracks with no coding at all.",
  },
  {
    q: "What exactly is Direct2Hire?",
    a: "Direct2Hire is Avatar's learning-to-career program. You learn AI through live sessions and real projects, get career guidance along the way, and choose a plan based on how much career support you want.",
  },
  {
    q: "Are courses available separately?",
    a: "Our courses run inside Direct2Hire, with plans at different levels of career support. If you're only after a single course, talk to us and we'll point you to the right option.",
  },
  {
    q: "Who can sell on the Marketplace?",
    a: "The Marketplace is launching soon. If you build AI tools and would like to list them, get in touch through our contact page.",
  },
  {
    q: "How do trainer bookings work?",
    a: "The AI Trainer Community is coming soon. Until it launches, tell us what your team or institution needs and we'll connect you with the right trainer.",
  },
  {
    q: "What does an AI adoption engagement include?",
    a: "We study how your business works today, set up the right tools and connect them to your existing systems, train your team to use them, and review results with you regularly as you grow.",
  },
];

export const LA_FOOTER = [
  {
    title: "Platforms",
    links: [
      { label: "Learning", href: "/learning" },
      { label: "Direct2Hire", href: "/direct2hire" },
      { label: "Partners", href: "/partners" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Investors", href: "/investors" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms & Conditions", href: "/terms-and-conditions" },
      { label: "Privacy Policy", href: "/privacy-policy" },
    ],
  },
];
