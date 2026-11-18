/**
 * Path builders for course learning + assessments.
 *
 * - `public`  → /courses/:id/...          (open LMS)
 * - `dashboard` → /dashboard/learning/:courseId/...  (Direct2Hire)
 *
 * The whole /dashboard tree is already the Direct2Hire programme shell
 * (PAID-gated), so nesting under /dashboard/learning keeps URLs short and
 * matches /dashboard/placement/assessment/* — rather than
 * /dashboard/direct2hire/ai-learning/...
 */

export type LearningRouteScope = "public" | "dashboard";

export interface LearningRoutes {
  scope: LearningRouteScope;
  courseId: string;
  /** AI Learning hub / course catalog back-link */
  hub: string;
  learn: string;
  assessments: string;
  assessment: (assessmentId: string) => string;
  assessmentHistory: (assessmentId: string) => string;
  attempt: (attemptId: string) => string;
  results: (attemptId: string) => string;
}

export function createLearningRoutes(
  courseId: string,
  scope: LearningRouteScope = "public",
): LearningRoutes {
  if (scope === "dashboard") {
    const base = `/dashboard/learning/${courseId}`;
    return {
      scope,
      courseId,
      hub: "/dashboard/learning",
      learn: `${base}/learn`,
      assessments: `${base}/assessments`,
      assessment: (assessmentId) => `${base}/assessments/${assessmentId}`,
      assessmentHistory: (assessmentId) =>
        `${base}/assessments/${assessmentId}/history`,
      attempt: (attemptId) => `${base}/assessments/attempt/${attemptId}`,
      results: (attemptId) => `${base}/assessments/results/${attemptId}`,
    };
  }

  const base = `/courses/${courseId}`;
  return {
    scope,
    courseId,
    hub: "/courses",
    learn: `${base}/learn`,
    assessments: `${base}/assessment`,
    assessment: (assessmentId) => `${base}/assessment/${assessmentId}`,
    assessmentHistory: (assessmentId) =>
      `${base}/assessment/${assessmentId}/history`,
    attempt: (attemptId) => `${base}/assessment/attempt/${attemptId}`,
    results: (attemptId) => `${base}/assessment/results/${attemptId}`,
  };
}

/** Convenience: Direct2Hire learning paths for a course. */
export function d2hLearningRoutes(courseId: string): LearningRoutes {
  return createLearningRoutes(courseId, "dashboard");
}

export function isDashboardLearningPath(pathname: string): boolean {
  return (
    pathname === "/dashboard/learning" ||
    pathname.startsWith("/dashboard/learning/")
  );
}

export function isLearningSubpath(pathname: string): boolean {
  return /\/dashboard\/learning\/[^/]+\/learn(\/|$)/.test(pathname);
}

export function isAssessmentsSubpath(pathname: string): boolean {
  return /\/dashboard\/learning\/[^/]+\/assessments(\/|$)/.test(pathname);
}

/** Extract courseId from a dashboard learning URL, if present. */
export function courseIdFromDashboardLearningPath(
  pathname: string,
): string | null {
  const match = pathname.match(/^\/dashboard\/learning\/([^/]+)/);
  if (!match || match[1] === "learn") return null;
  // exclude reserved segments that aren't course ids (none today)
  return match[1] ?? null;
}
