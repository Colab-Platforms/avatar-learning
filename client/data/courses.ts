import type { Course } from "@/types";

export const COURSE_FILTERS = ["All", "Beginner", "Intermediate", "Advanced"] as const;

export const COURSES: Course[] = [
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
      { title: "Introduction To AI", session: "Session 1 of 8", image: "/landingpage-images/course-1.jpg" },
      { title: "Understanding LLMs", session: "Session 2 of 8", image: "/landingpage-images/course-3.jpg" },
      { title: "ChatGPT Interface & Features", session: "Session 3 of 8", image: "/landingpage-images/course-4.jpg" },
      { title: "Research, Writing & Coding with AI", session: "Session 4 of 8", image: "/landingpage-images/course-2.jpg" },
    ],
  },
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
      { title: "Anatomy Of A Prompt", session: "Session 1 of 6", image: "/landingpage-images/course-2.jpg" },
      { title: "Prompt Patterns & Structure", session: "Session 2 of 6", image: "/landingpage-images/course-3.jpg" },
      { title: "Chain-of-Thought & ReAct Framework", session: "Session 3 of 6", image: "/landingpage-images/course-1.jpg" },
      { title: "Tree-of-Thought & Meta-Prompting", session: "Session 4 of 6", image: "/landingpage-images/course-4.jpg" },
    ],
  },
];
