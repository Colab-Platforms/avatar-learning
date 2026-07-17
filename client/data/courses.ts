import type { Course } from "@/types";

export const COURSE_FILTERS = [
  "All",
  "Beginner",
  "Intermediate",
  "Advanced",
] as const;
//static courses data for now, later we can fetch it from the backend for landing page and course details page
export const COURSES: Course[] = [
  /* ────────────────────────────────────────────────
     AI Fundamentals & ChatGPT Mastery
  ──────────────────────────────────────────────── */
  {
    id: "ai-fundamentals",
    slug: "ai-fundamentals-chatgpt-mastery",
    title: "AI Fundamentals & ChatGPT Mastery",
    level: "Beginner",
    free: false,
    tools: ["ChatGPT", "Claude", "Gemini", "Midjourney", "Notion AI"],
    weeks: 4,
    sessions: "8 Sessions (Sat & Sun)",
    certificate: true,
    modules: [
      {
        title: "AI Landscape",
        week: "week 1 of 4",
        image: "/landingpage-images/course-1.png",
      },
      {
        title: "Mastering ChatGPT",
        week: "week 2 of 4",
        image: "/landingpage-images/course-2.png",
      },
      // {
      //   title: "Prompt Essentials",
      //   week: "week 3 of 4",
      //   image: "/landingpage-images/course-3.png",
      // },
      // {
      //   title: "AI Productivity",
      //   week: "week 4 of 4",
      //   image: "/landingpage-images/course-4.jpg",
      // },
    ],

    /* ── Detail fields ── */
    description:
      "Master the foundations of AI and become confident using ChatGPT, Claude, Gemini, and more through hands-on portfolio projects that showcase real-world skills.",
    rating: 4.7,
    reviews: "1.2k Reviews",
    startDate: "17 Jul 2026",
    seats: "Limited Seats",
    heroImage: "/landingpage-images/course-1.png",
    bannerImage: "/landingpage-images/course-2.png",

    whatYouLearn: [
      {
        title: "Understand LLMs & Prompting",
        body: "Grasp how large language models work and write effective prompts that produce accurate, useful outputs.",
      },
      {
        title: "AI for Research, Writing & Productivity",
        body: "Use AI to supercharge your research, drafting, and daily workflows — saving hours every week.",
      },
      {
        title: "Build Real Portfolio Projects",
        body: "Complete guided projects across content creation, data analysis, and automation to build a job-ready AI portfolio.",
      },
      {
        title: "Tool Compilation & Critical Thinking",
        body: "Evaluate and combine the best AI tools — ChatGPT, Claude, Gemini, Midjourney, Notion AI — for any task.",
      },
    ],

    weekData: [
      {
        title: "Week 1 — Foundations of AI & ChatGPT",
        modules: [
          "Introduction to Generative AI & LLMs",
          "ChatGPT Interface & Core Features Deep-Dive",
          "Your First AI Workflow: Summarise, Rewrite, Brainstorm",
        ],
      },
      {
        title: "Week 2 — Prompt Engineering Mastery",
        modules: [
          "Prompt Anatomy: Role, Context, Format & Constraints",
          "Advanced Techniques: Chain-of-Thought & Few-Shot",
          "Live Workshop: Prompt Battle & Peer Review",
        ],
      },
      {
        title: "Week 3 — AI for Research, Writing & Coding",
        modules: [
          "AI-Assisted Research & Fact-Checking",
          "Content Creation: Blog, Email, Social Copy with AI",
          "Coding Sidekick: Debug, Explain & Generate Code",
        ],
      },
      {
        title: "Week 4 — Tool Companion + Capstone Project",
        modules: [
          "Exploring Claude, Gemini, Midjourney & Notion AI",
          "Build Your Capstone: AI-Powered Portfolio Piece",
          "Demo Day & Certificate Ceremony",
        ],
      },
    ],

    audience: [
      {
        title: "Students & Freshers",
        body: "Kickstart your career in the AI era with confidence and a portfolio that stands out.",
      },
      {
        title: "Working Professionals",
        body: "Level up your efficiency using AI tools and prompts — no coding background needed.",
      },
      {
        title: "Career Switchers",
        body: "Pivot into AI-adjacent roles by demonstrating hands-on fluency with the most in-demand tools.",
      },
      {
        title: "Business Owners & Founders",
        body: "Automate operations, boost content output, and cut costs using AI across your entire business.",
      },
    ],
  },

  /* ────────────────────────────────────────────────
     Prompt Engineering Advanced
  ──────────────────────────────────────────────── */
  {
    id: "prompt-engineering",
    slug: "prompt-engineering-advanced",
    title: "Prompt Engineering Advanced",
    level: "Beginner",
    free: false,
    tools: ["ChatGPT API", "Claude API", "PromptBase", "LangChain basics"],
    weeks: 3,
    sessions: "6 Sessions (Sat & Sun)",
    certificate: true,
    modules: [
      {
        title: "Foundations of Prompt Engineering",
        week: "week 1 of 3",
        image: "/landingpage-images/course-5.jpg",
      },
      {
        title: "Advanced Techniques",
        week: "week 2 of 3",
        image: "/landingpage-images/course-6.jpg",
      },
      // {
      //   title: "Industry Applications",
      //   week: "week 3 of 3",
      //   image: "/landingpage-images/course-7.jpg",
      // },
    ],

    /* ── Detail fields ── */
    description:
      "Go beyond basic prompting. Learn to engineer precise, reproducible prompts using ChatGPT API, Claude API, LangChain, and PromptBase to build AI-powered products.",
    rating: 4.8,
    reviews: "840 Reviews",
    startDate: "24 Jul 2026",
    seats: "Limited Seats",
    heroImage: "/landingpage-images/course-5.jpg",
    bannerImage: "/landingpage-images/course-6.jpg",

    whatYouLearn: [
      {
        title: "Advanced Prompt Patterns",
        body: "Master chain-of-thought, few-shot, ReAct, and tree-of-thought prompting techniques used by AI engineers.",
      },
      {
        title: "API Integration & Automation",
        body: "Connect ChatGPT and Claude APIs to build automated pipelines for real-world applications.",
      },
      {
        title: "LangChain Fundamentals",
        body: "Build multi-step AI agents and RAG applications using LangChain's composable framework.",
      },
      {
        title: "Prompt Monetisation",
        body: "Publish and sell high-quality prompts on PromptBase while building a recurring income stream.",
      },
    ],

    weekData: [
      {
        title: "Week 1 — Foundations of Prompt Engineering",
        modules: [
          "Prompting Paradigms: Zero-shot vs Few-shot vs Chain-of-Thought",
          "Anatomy of a Production Prompt",
          "Evaluating & Iterating Prompts Systematically",
        ],
      },
      {
        title: "Week 2 — Advanced Techniques",
        modules: [
          "ReAct & Tool-Use Prompting",
          "Tree-of-Thought & Self-Consistency",
          "Red-Teaming: Finding & Fixing Prompt Failures",
        ],
      },
      {
        title: "Week 3 — Industry Applications",
        modules: [
          "Building a RAG Application with LangChain",
          "API Automation: End-to-End AI Pipeline",
          "Capstone: Ship Your Prompt-Powered Product",
        ],
      },
    ],

    audience: [
      {
        title: "AI Enthusiasts",
        body: "Take your AI skills from hobbyist to professional-grade with structured, hands-on engineering.",
      },
      {
        title: "Developers",
        body: "Integrate LLMs into your products with confidence — prompting, APIs, and LangChain included.",
      },
      {
        title: "Product Managers",
        body: "Spec out and evaluate AI features with the technical depth to guide your engineering team.",
      },
      {
        title: "Freelancers & Consultants",
        body: "Offer high-value AI consulting and automation services backed by real engineering knowledge.",
      },
    ],
  },

  /* ────────────────────────────────────────────────
     Building AI Agents
  ──────────────────────────────────────────────── */
  {
    id: "building-ai-agents",
    slug: "building-ai-agents",
    title: "Building AI Agents",
    level: "Advanced",
    free: false,
    tools: ["LangChain", "CrewAI", "AutoGPT", "FastAPI", "Docker"],
    weeks: 6,
    sessions: "12 Sessions (Sat & Sun)",
    certificate: true,
    modules: [
      {
        title: "Agent Foundations",
        week: "week 1 of 6",
        image: "/landingpage-images/course-3.png", // fallback placeholder
      },
      {
        title: "Deploying Agents",
        week: "week 6 of 6",
        image: "/landingpage-images/course-4.jpg", // fallback placeholder
      },
    ],
    description:
      "Deploy autonomous AI agents that complete multi-step tasks. Master LangChain, CrewAI, and AutoGPT frameworks, connect agents to real-world tools and databases, and deploy production-ready agents on cloud infrastructure — then list and monetize your own agent on the Avatar Marketplace.",
    rating: 4.2,
    reviews: "805 Reviews",
    startDate: "Coming Soon",
    seats: "Limited Seats",
    heroImage: "/landingpage-images/course-3.png",
    bannerImage: "/landingpage-images/course-4.jpg",
    whatYouLearn: [
      {
        title: "Autonomous Agents",
        body: "Understand the core concepts of autonomous AI agents and how they differ from simple chatbots.",
      },
      {
        title: "Framework Mastery",
        body: "Build complex multi-agent systems using CrewAI, LangChain, and AutoGPT.",
      },
      {
        title: "Tool Integration",
        body: "Connect your agents to external APIs, databases, and real-world tools to automate workflows.",
      },
      {
        title: "Production Deployment",
        body: "Deploy your agents securely using FastAPI and Docker, and list them on the Avatar Marketplace.",
      },
    ],
    weekData: [
      {
        title: "Week 1-2 — Foundations of AI Agents",
        modules: [
          "Introduction to Autonomous Agents",
          "Working with LangChain for Agentic Workflows",
          "Building Your First Simple Agent",
        ],
      },
      {
        title: "Week 3-4 — Multi-Agent Systems",
        modules: [
          "Deep Dive into CrewAI",
          "Designing Multi-Agent Collaboration",
          "Integrating External Tools and APIs",
        ],
      },
      {
        title: "Week 5-6 — Production and Monetization",
        modules: [
          "Packaging Agents with Docker & FastAPI",
          "Deploying to Cloud Infrastructure",
          "Listing on Avatar Marketplace & Final Project",
        ],
      },
    ],
    audience: [
      {
        title: "AI Engineers",
        body: "Learn to build production-ready agentic systems and scale them effectively.",
      },
      {
        title: "Full Stack Developers",
        body: "Expand your skill set into the cutting edge of AI application development.",
      },
      {
        title: "Tech Entrepreneurs",
        body: "Build autonomous workflows that can be monetized as SaaS or marketplace products.",
      },
    ],
  },
];
