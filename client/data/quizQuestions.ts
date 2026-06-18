// Types 
export type DomainKey = "TC" | "BM" | "HS" | "CD" | "ED" | "MC";

export interface QuizOption {
  label: string;
  desc?: string;
  icon: string;
  scores: Partial<Record<DomainKey, number>>;
}

export interface QuizQuestion {
  id: number;
  emoji: string;
  title: string;
  sub: string;
  multi: boolean;
  options: QuizOption[];
}

// Questions 

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    emoji: "👋",
    title: "First up — what area interests you the most?",
    sub: "Pick the one that feels most like you",
    multi: false,
    options: [
      { label: "Tech & Computers",            desc: "Coding, apps, AI and gadgets",             icon: "💻", scores: { TC: 5, ED: 3 } },
      { label: "Business & Management",       desc: "Planning, strategy and leading teams",      icon: "📊", scores: { BM: 5, MC: 2 } },
      { label: "Healthcare & Helping others", desc: "Improving people's health and lives",       icon: "🏥", scores: { HS: 5, CD: 1 } },
      { label: "Creative & Design",           desc: "Art, visuals, content and storytelling",    icon: "🎨", scores: { CD: 5, MC: 2 } },
      { label: "Engineering & Building things",desc: "Making, fixing and building systems",      icon: "🔧", scores: { ED: 5, TC: 2 } },
      { label: "Marketing & Communication",   desc: "Promoting ideas and talking to people",     icon: "📣", scores: { MC: 5, BM: 2 } },
    ],
  },
  {
    id: 2,
    emoji: "🕐",
    title: "What do you usually enjoy doing in your free time?",
    sub: "You can pick more than one",
    multi: true,
    options: [
      { label: "Watching tech videos or tutorials", icon: "📱", scores: { TC: 3, ED: 2 } },
      { label: "Reading about business or money",   icon: "📈", scores: { BM: 3, MC: 1 } },
      { label: "Helping or volunteering for others",icon: "🤝", scores: { HS: 3, CD: 1 } },
      { label: "Drawing, designing or making things",icon: "✏️", scores: { CD: 3, MC: 2 } },
      { label: "Building or fixing things by hand", icon: "🔨", scores: { ED: 3, TC: 2 } },
      { label: "Creating content, reels or writing",icon: "🎬", scores: { MC: 3, CD: 2 } },
    ],
  },
  {
    id: 3,
    emoji: "📚",
    title: "Which subject did you enjoy most in school or college?",
    sub: "Pick just one",
    multi: false,
    options: [
      { label: "Maths & Computer Science",          icon: "🧮", scores: { TC: 4, ED: 3 } },
      { label: "Economics & Commerce",              icon: "💰", scores: { BM: 4, MC: 2 } },
      { label: "Biology & Life Sciences",           icon: "🧬", scores: { HS: 4, CD: 1 } },
      { label: "Art, Design & Literature",          icon: "🖌️", scores: { CD: 4, MC: 2 } },
      { label: "Physics & Engineering",             icon: "⚙️", scores: { ED: 4, TC: 2 } },
      { label: "Marketing, Media & Social Studies", icon: "🌍", scores: { MC: 4, BM: 1 } },
    ],
  },
  {
    id: 4,
    emoji: "🏢",
    title: "Where would you love to work one day?",
    sub: "Pick all that sound exciting to you",
    multi: true,
    options: [
      { label: "A tech startup or big tech company", icon: "🚀", scores: { TC: 3, ED: 2 } },
      { label: "A corporate office or consulting firm",icon: "🏦", scores: { BM: 3, MC: 1 } },
      { label: "A hospital, clinic or health brand",  icon: "💊", scores: { HS: 3 } },
      { label: "A design studio or media agency",     icon: "🎭", scores: { CD: 3, MC: 2 } },
      { label: "A factory, lab or engineering firm",  icon: "🏭", scores: { ED: 3, TC: 1 } },
      { label: "My own business or freelancing",      icon: "💼", scores: { MC: 3, CD: 2 } },
    ],
  },
  {
    id: 5,
    emoji: "🤔",
    title: "When you're stuck on a problem, what do you do first?",
    sub: "Be honest — pick the one that sounds most like you",
    multi: false,
    options: [
      { label: "Search online for how others solved it", icon: "🔍", scores: { TC: 4, ED: 2 } },
      { label: "Make a plan or list of steps",            icon: "📋", scores: { BM: 4, MC: 2 } },
      { label: "Talk to someone who knows more",          icon: "💬", scores: { HS: 4, CD: 1 } },
      { label: "Sketch ideas or brainstorm on paper",     icon: "📝", scores: { CD: 4, MC: 2 } },
      { label: "Just try something and see what happens", icon: "⚡", scores: { ED: 4, TC: 2 } },
      { label: "Look at the numbers or data first",       icon: "📊", scores: { MC: 3, BM: 3 } },
    ],
  },
  {
    id: 6,
    emoji: "💪",
    title: "Which of these do you feel you are naturally good at?",
    sub: "Pick up to 3 that feel most true",
    multi: true,
    options: [
      { label: "Logical thinking and problem solving", icon: "🧩", scores: { TC: 4, ED: 3 } },
      { label: "Convincing and communicating ideas",   icon: "🗣️", scores: { BM: 3, MC: 4 } },
      { label: "Listening and understanding people",   icon: "👂", scores: { HS: 4, CD: 2 } },
      { label: "Creative and visual thinking",         icon: "🎨", scores: { CD: 4, MC: 2 } },
      { label: "Technical and hands-on building",      icon: "🔧", scores: { ED: 4, TC: 2 } },
      { label: "Research and spotting trends",         icon: "📉", scores: { MC: 3, BM: 3 } },
    ],
  },
  {
    id: 7,
    emoji: "👥",
    title: "In a group project, what role do you naturally take?",
    sub: "Pick one",
    multi: false,
    options: [
      { label: "The one who builds or codes things",    icon: "💻", scores: { TC: 5, ED: 2 } },
      { label: "The leader who organises the team",     icon: "👑", scores: { BM: 5, MC: 2 } },
      { label: "The one who keeps everyone together",   icon: "🤝", scores: { HS: 4, CD: 2 } },
      { label: "The one who makes it look great",       icon: "✨", scores: { CD: 5, MC: 2 } },
      { label: "The one who actually builds the product",icon: "🏗️", scores: { ED: 5, TC: 2 } },
      { label: "The one who pitches and presents it",   icon: "🎤", scores: { MC: 5, BM: 2 } },
    ],
  },
  {
    id: 8,
    emoji: "⏰",
    title: "Which of these could you happily do for hours without getting bored?",
    sub: "Pick all that apply",
    multi: true,
    options: [
      { label: "Coding or exploring AI tools",        icon: "🤖", scores: { TC: 4, ED: 2 } },
      { label: "Reading about business trends",       icon: "📰", scores: { BM: 3, MC: 2 } },
      { label: "Caring for or advising people",       icon: "🧘", scores: { HS: 4 } },
      { label: "Creating graphics, videos or content",icon: "🖼️", scores: { CD: 4, MC: 3 } },
      { label: "Assembling, fixing or building things",icon: "🛠️", scores: { ED: 4, TC: 2 } },
      { label: "Running campaigns and growing pages", icon: "📲", scores: { MC: 4, CD: 1 } },
    ],
  },
  {
    id: 9,
    emoji: "🌟",
    title: "What does your dream life look like in 5 years?",
    sub: "Pick all that excite you",
    multi: true,
    options: [
      { label: "Working at a top tech company",        icon: "🚀", scores: { TC: 4, ED: 2 } },
      { label: "Running my own business",              icon: "💡", scores: { BM: 4, MC: 2 } },
      { label: "Making a real difference in health",   icon: "❤️", scores: { HS: 4 } },
      { label: "Being a well-known creative",          icon: "🌈", scores: { CD: 4, MC: 2 } },
      { label: "Building products used by millions",   icon: "🏆", scores: { ED: 4, TC: 2 } },
      { label: "Being a recognised voice in my field", icon: "📢", scores: { MC: 4, BM: 1 } },
    ],
  },
  {
    id: 10,
    emoji: "💫",
    title: "What matters most to you in a career?",
    sub: "Pick up to 2",
    multi: true,
    options: [
      { label: "Solving hard problems and learning",  icon: "🧠", scores: { TC: 4, ED: 3 } },
      { label: "High salary and financial stability", icon: "💸", scores: { BM: 4, MC: 2 } },
      { label: "Making a positive impact on people",  icon: "🌿", scores: { HS: 4, CD: 1 } },
      { label: "Freedom to be creative",              icon: "🎭", scores: { CD: 4, MC: 2 } },
      { label: "Building real things that actually work",icon: "⚙️", scores: { ED: 4, TC: 2 } },
      { label: "Building a personal brand online",    icon: "🌐", scores: { MC: 4, BM: 1 } },
    ],
  },
];

// ── Domain metadata ──────────────────────────────────────────────────────────

export const DOMAINS: Record<DomainKey, { label: string; color: string }> = {
  TC: { label: "Technical",   color: "#6C63FF" },
  BM: { label: "Business",    color: "#1D9E75" },
  HS: { label: "Healthcare",  color: "#D85A30" },
  CD: { label: "Creative",    color: "#D4537E" },
  ED: { label: "Engineering", color: "#378ADD" },
  MC: { label: "Marketing",   color: "#BA7517" },
};

// ── Role definitions ─────────────────────────────────────────────────────────

export interface Role {
  emoji: string;
  title: string;
  domain: DomainKey;
  match: DomainKey[];
  desc: string;
  roadmap: string[];
  courses: { name: string; level: string; icon: string }[];
}

export const ROLES: Role[] = [
  {
    emoji: "💻",
    title: "AI & Software Developer",
    domain: "TC",
    match: ["TC", "ED"],
    desc: "You will build apps, websites and AI tools that millions of people use every day. This is one of the most in-demand and highest-paying careers right now — and it is only getting bigger with AI.",
    roadmap: ["Fresher / Intern", "Junior Developer", "Software Engineer", "Senior Engineer", "Tech Lead / CTO"],
    courses: [
      { name: "AI Fundamentals for Beginners",    level: "Starter",       icon: "🤖" },
      { name: "Python & Machine Learning Bootcamp",level: "Intermediate",  icon: "🐍" },
      { name: "Full Stack Web Development",        level: "Intermediate",  icon: "🌐" },
    ],
  },
  {
    emoji: "📊",
    title: "Business Strategy & Management",
    domain: "BM",
    match: ["BM", "MC"],
    desc: "You will help companies grow, plan ahead and make smart decisions. If you are a natural leader who enjoys communication and thinking strategically, business and management consulting is your path.",
    roadmap: ["Fresher / Trainee", "Business Analyst", "Associate Manager", "Strategy Manager", "Director / C-Suite"],
    courses: [
      { name: "Business Fundamentals for Freshers", level: "Starter",      icon: "📋" },
      { name: "AI for Business Leaders",             level: "Intermediate", icon: "🧠" },
      { name: "Financial Modelling & Analytics",     level: "Intermediate", icon: "📈" },
    ],
  },
  {
    emoji: "🏥",
    title: "Healthcare & Wellness Professional",
    domain: "HS",
    match: ["HS", "TC"],
    desc: "You will work in one of India's fastest-growing sectors. From hospital management to health tech startups, this career lets you combine empathy with real impact on people's lives every single day.",
    roadmap: ["Fresher / Trainee", "Health Analyst", "Health Tech Specialist", "Manager", "Director of Healthcare AI"],
    courses: [
      { name: "Introduction to Health Tech",     level: "Starter",   icon: "💊" },
      { name: "AI in Healthcare Certification",  level: "Intermediate", icon: "🩺" },
      { name: "Medical Data & Analytics",        level: "Advanced",  icon: "📊" },
    ],
  },
  {
    emoji: "🎨",
    title: "Creative Designer & Content Creator",
    domain: "CD",
    match: ["CD", "MC"],
    desc: "You will design brands, create campaigns and produce content that moves people. Creativity is your superpower — and with AI design tools available today, there has never been a better time to be creative.",
    roadmap: ["Fresher / Intern", "Junior Designer", "Creative Designer", "Creative Lead", "Creative Director"],
    courses: [
      { name: "Graphic Design for Beginners",    level: "Starter",      icon: "✏️" },
      { name: "AI Design Tools Certification",   level: "Intermediate", icon: "🖥️" },
      { name: "UI/UX & Product Design Bootcamp", level: "Advanced",     icon: "📱" },
    ],
  },
  {
    emoji: "⚙️",
    title: "Engineering & Systems Builder",
    domain: "ED",
    match: ["ED", "TC"],
    desc: "You will build the systems and infrastructure that power the modern world — from robotics to cloud platforms to automation. If you love making things that actually work, this career is made for you.",
    roadmap: ["Trainee Engineer", "Junior Engineer", "Systems Engineer", "Principal Engineer", "Engineering Director"],
    courses: [
      { name: "Engineering Fundamentals with AI",  level: "Starter",      icon: "🔧" },
      { name: "Automation & Robotics Certification",level: "Intermediate", icon: "🤖" },
      { name: "Cloud & AI Infrastructure",          level: "Advanced",     icon: "☁️" },
    ],
  },
  {
    emoji: "📣",
    title: "Digital Marketing & Growth Specialist",
    domain: "MC",
    match: ["MC", "CD"],
    desc: "You will grow brands, run campaigns and build audiences using the latest digital tools and AI. Perfect if you love creating content, connecting with people and want to shape how the world sees a brand.",
    roadmap: ["Marketing Trainee", "Digital Marketer", "Growth Specialist", "Marketing Manager", "CMO / Brand Founder"],
    courses: [
      { name: "Digital Marketing Starter Kit", level: "Starter",      icon: "📱" },
      { name: "AI Marketing Certification",    level: "Intermediate", icon: "📲" },
      { name: "Growth Hacking with AI",        level: "Advanced",     icon: "🚀" },
    ],
  },
];

// ── Scoring engine ───────────────────────────────────────────────────────────

// answers: { [questionId]: string[] } — always arrays (single-select stored as 1-item array)
export function computeResult(answers: Record<number, string[]>): {
  role: Role;
  domainScores: Record<DomainKey, number>;
  matchPct: number;
  secondRole: Role;
  secondPct: number;
} {
  const totals: Record<DomainKey, number> = { TC: 0, BM: 0, HS: 0, CD: 0, ED: 0, MC: 0 };

  for (const q of QUIZ_QUESTIONS) {
    const selected = answers[q.id] ?? [];
    for (const label of selected) {
      const opt = q.options.find((o) => o.label === label);
      if (!opt) continue;
      for (const [key, val] of Object.entries(opt.scores) as [DomainKey, number][]) {
        totals[key] += val;
      }
    }
  }

  // Sort domains by score
  const sorted = (Object.entries(totals) as [DomainKey, number][]).sort((a, b) => b[1] - a[1]);
  const maxScore = sorted[0][1] || 1;

  // Find top role and second role
  function findRole(domainKey: DomainKey) {
    return ROLES.find((r) => r.domain === domainKey) ?? ROLES[0];
  }

  const topRole   = findRole(sorted[0][0]);
  const secondRole = findRole(sorted[1][0]);

  // Normalise to percentage (max possible per question ~5 pts × 10 questions = 50)
  const maxPossible = 50;
  const matchPct   = Math.min(98, Math.round((sorted[0][1] / maxPossible) * 100) + 40);
  const secondPct  = Math.min(95, Math.round((sorted[1][1] / maxPossible) * 100) + 30);

  // Domain scores as percentages for display bars
  const domainScores = {} as Record<DomainKey, number>;
  for (const [k, v] of Object.entries(totals) as [DomainKey, number][]) {
    domainScores[k] = Math.min(98, Math.round((v / maxPossible) * 100) + 20);
  }

  return { role: topRole, domainScores, matchPct, secondRole, secondPct };
}
