export interface Webinar {
  id: string;
  free: boolean;
  date: string;
  time: string;
  title: string;
  learns: string[];
  registerHref: string;
  calendarHref: string;
}

export const WEBINARS_SECTION = {
  eyebrow: "FREE LIVE SESSIONS",
  heading: "Upcoming Webinars",
  description:
    "Join our expert-led webinars. All sessions are free to attend. Get a Certificate of Participation after the session.",
  certificateLabel: "Certificate of Participation included",
};

export const WEBINARS: Webinar[] = [
  {
    id: "intro-prompt-engineering",
    free: true,
    date: "20 June 2026",
    time: "7:00 PM – 8:30 PM IST",
    title: "Introduction to Prompt Engineering",
    learns: [
      "How prompts actually work",
      "Best practices for ChatGPT, Claude & Gemini",
      "Common mistakes to avoid",
      "Live prompt building demo",
    ],
    registerHref: "#",
    calendarHref: "#",
  },
  {
    id: "ai-daily-productivity",
    free: true,
    date: "27 June 2026",
    time: "7:00 PM – 8:30 PM IST",
    title: "How to Use AI for Daily Productivity",
    learns: [
      "Best AI tools for emails, research & writing",
      "Building your personal AI workflow",
      "Time-saving prompts you can use immediately",
      "Real examples from professionals",
    ],
    registerHref: "#",
    calendarHref: "#",
  },
  {
    id: "ai-automation-n8n",
    free: true,
    date: "4 July 2026",
    time: "7:00 PM – 8:30 PM IST",
    title: "Automate Your Work with n8n & AI",
    learns: [
      "What is n8n and how it connects to AI",
      "Build your first automation workflow live",
      "Real business use-cases with no code",
      "Save 10+ hours a week with automation",
    ],
    registerHref: "#",
    calendarHref: "#",
  },
  {
    id: "ai-image-midjourney",
    free: true,
    date: "11 July 2026",
    time: "7:00 PM – 8:30 PM IST",
    title: "AI Image Generation with Midjourney",
    learns: [
      "Midjourney basics — prompts, styles & settings",
      "Creating professional visuals for business",
      "Advanced techniques: inpainting & variations",
      "Turn AI art into income",
    ],
    registerHref: "#",
    calendarHref: "#",
  },
];
