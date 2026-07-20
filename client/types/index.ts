export type Level = "Beginner" | "Intermediate" | "Advanced";

export interface ApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
}
export interface NavItem {
  label: string;
  href: string;
}

export interface CourseModule {
  title: string;
  week: string;
  image: string;
}

export interface CourseLearnItem {
  title: string;
  body: string;
}

export interface CourseWeek {
  title: string;
  modules: string[];
}

export interface CourseAudienceItem {
  title: string;
  body: string;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  level: Level;
  free: boolean;
  tools: string[];
  weeks: number;
  sessions: string;
  certificate: boolean;
  modules: CourseModule[];
  // Detail-page fields
  description: string;
  rating: number;
  reviews: string;
  startDate: string;
  seats: string;
  heroImage: string;
  bannerImage: string;
  whatYouLearn: CourseLearnItem[];
  weekData: CourseWeek[];
  audience: CourseAudienceItem[];
}

export interface Feature {
  title: string;
  body: string;
}

export interface CountdownItem {
  value: string;
  label: string;
}

export interface HackathonData {
  eyebrow: string;
  title: string;
  description: string;
  date: string;
  prizeText: string;
  ctaLabel: string;
  countdown: CountdownItem[];
}

export interface FooterColumn {
  title: string;
  items: Array<{ label: string; href: string }>;
}

export interface SocialLink {
  platform: "facebook" | "instagram" | "linkedin" | "youtube";
  href: string;
  label: string;
}

export interface HeroSlide {
  eyebrow: string;
  heading: string;
  badge: {
    free?: boolean;
    level: Level;
    date: string;
  };
  courseTitle: string;
  courseMeta: string;
  primaryCta: string;
  secondaryCta: string;
}

export interface QuizBannerData {
  eyebrow: string;
  heading: string;
  description: string;
  ctaLabel: string;
  image: string;
}

export interface AdvisorCtaData {
  eyebrow: string;
  heading: string;
  description: string;
  ctaLabel: string;
  ctaLabel2: string;
  image: string;
}
