import type { Course } from "@/types";

export const COURSE_FILTERS = ["All", "Beginner", "Intermediate", "Advanced"] as const;

export const COURSES: Course[] = [
  /* ────────────────────────────────────────────────
     AI Fundamentals & ChatGPT Mastery
  ──────────────────────────────────────────────── */
  {
    id: "ai-fundamentals",
    title: "AI Fundamentals & ChatGPT Mastery",
    level: "Beginner",
    free: true,
    tools: ["ChatGPT", "Claude", "Gemini", "Midjourney", "Notion AI"],
    weeks: 4,
    sessions: "8 Sessions (Sat & Sun)",
    certificate: true,
    modules: [
      { title: "AI Landscape",       week: "week 1 of 4", image: "/landingpage-images/course-1.png" },
      { title: "Mastering ChatGPT",  week: "week 2 of 4", image: "/landingpage-images/course-2.png" },
      { title: "Prompt Essentials",  week: "week 3 of 4", image: "/landingpage-images/course-3.png" },
      { title: "AI Productivity",    week: "week 4 of 4", image: "/landingpage-images/course-4.jpg" },
    ],

    /* ── Detail fields ── */
    description:
      "Master the foundations of AI and become confident using ChatGPT, Claude, Gemini, and more through hands-on portfolio projects that showcase real-world skills.",
    rating: 4.7,
    reviews: "1.2k Reviews",
    startDate: "17 Jul 2026",
    seats: "Limited Seats",
    heroImage:  "/landingpage-images/course-1.png",
    bannerImage: "/landingpage-images/course-2.png",

    whatYouLearn: [
      {
        iconName: "Brain",
        title: "Understand LLMs & Prompting",
        body: "Grasp how large language models work and write effective prompts that produce accurate, useful outputs.",
      },
      {
        iconName: "PenLine",
        title: "AI for Research, Writing & Productivity",
        body: "Use AI to supercharge your research, drafting, and daily workflows — saving hours every week.",
      },
      {
        iconName: "FolderCode",
        title: "Build Real Portfolio Projects",
        body: "Complete guided projects across content creation, data analysis, and automation to build a job-ready AI portfolio.",
      },
      {
        iconName: "Wrench",
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
        iconName: "GraduationCap",
        title: "Students & Freshers",
        body: "Kickstart your career in the AI era with confidence and a portfolio that stands out.",
      },
      {
        iconName: "Briefcase",
        title: "Working Professionals",
        body: "Level up your efficiency using AI tools and prompts — no coding background needed.",
      },
      {
        iconName: "RefreshCw",
        title: "Career Switchers",
        body: "Pivot into AI-adjacent roles by demonstrating hands-on fluency with the most in-demand tools.",
      },
      {
        iconName: "Building2",
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
    title: "Prompt Engineering Advanced",
    level: "Beginner",
    free: true,
    tools: ["ChatGPT API", "Claude API", "PromptBase", "LangChain basics"],
    weeks: 3,
    sessions: "6 Sessions (Sat & Sun)",
    certificate: true,
    modules: [
      { title: "Foundations of Prompt Engineering", week: "week 1 of 3", image: "/landingpage-images/course-5.jpg" },
      { title: "Advanced Techniques",               week: "week 2 of 3", image: "/landingpage-images/course-6.jpg" },
      { title: "Industry Applications",             week: "week 3 of 3", image: "/landingpage-images/course-7.jpg" },
    ],

    /* ── Detail fields ── */
    description:
      "Go beyond basic prompting. Learn to engineer precise, reproducible prompts using ChatGPT API, Claude API, LangChain, and PromptBase to build AI-powered products.",
    rating: 4.8,
    reviews: "840 Reviews",
    startDate: "24 Jul 2026",
    seats: "Limited Seats",
    heroImage:  "/landingpage-images/course-5.jpg",
    bannerImage: "/landingpage-images/course-6.jpg",

    whatYouLearn: [
      {
        iconName: "Brain",
        title: "Advanced Prompt Patterns",
        body: "Master chain-of-thought, few-shot, ReAct, and tree-of-thought prompting techniques used by AI engineers.",
      },
      {
        iconName: "PenLine",
        title: "API Integration & Automation",
        body: "Connect ChatGPT and Claude APIs to build automated pipelines for real-world applications.",
      },
      {
        iconName: "FolderCode",
        title: "LangChain Fundamentals",
        body: "Build multi-step AI agents and RAG applications using LangChain's composable framework.",
      },
      {
        iconName: "Wrench",
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
        iconName: "GraduationCap",
        title: "AI Enthusiasts",
        body: "Take your AI skills from hobbyist to professional-grade with structured, hands-on engineering.",
      },
      {
        iconName: "Briefcase",
        title: "Developers",
        body: "Integrate LLMs into your products with confidence — prompting, APIs, and LangChain included.",
      },
      {
        iconName: "RefreshCw",
        title: "Product Managers",
        body: "Spec out and evaluate AI features with the technical depth to guide your engineering team.",
      },
      {
        iconName: "Building2",
        title: "Freelancers & Consultants",
        body: "Offer high-value AI consulting and automation services backed by real engineering knowledge.",
      },
    ],
  },
];
