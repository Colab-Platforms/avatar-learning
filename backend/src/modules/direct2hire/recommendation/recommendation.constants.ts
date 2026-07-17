import coursesData from "./data/direct2hire-courses.json" with { type: "json" };

export const RECOMMENDATION_PROMPT_VERSION = "direct2hire-course-v1";

export interface Direct2HireCourseCatalogItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: string;
  totalWeeks: number;
  sessions: string;
  tools: string[];
  audience: Array<{ title: string; body: string }>;
  whatYouLearn: Array<{ title: string; body: string }>;
}

export const DIRECT2HIRE_COURSE_CATALOG =
  coursesData as Direct2HireCourseCatalogItem[];

export const DIRECT2HIRE_COURSE_SLUGS = DIRECT2HIRE_COURSE_CATALOG.map(
  (course) => course.slug,
);

export function getCourseBySlug(
  slug: string,
): Direct2HireCourseCatalogItem | undefined {
  return DIRECT2HIRE_COURSE_CATALOG.find((course) => course.slug === slug);
}

export function getCourseById(
  id: string,
): Direct2HireCourseCatalogItem | undefined {
  return DIRECT2HIRE_COURSE_CATALOG.find((course) => course.id === id);
}
