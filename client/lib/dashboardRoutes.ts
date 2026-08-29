/**
 * The Direct2Hire journey is per-course now, so every dashboard link needs the
 * course it belongs to. Building them in one place keeps the ~60 call sites
 * from drifting, and makes the next route change a single edit.
 */
export const dashboardRoutes = (courseId: string) => {
  const base = `/dashboard/${courseId}`;
  return {
    root: base,
    assessment: `${base}/assessment`,
    counselling: `${base}/counselling`,
    internships: `${base}/internships`,
    placement: `${base}/placement`,
    placementAssessment: `${base}/placement/assessment`,
    placementAttempt: (attemptId: string) =>
      `${base}/placement/assessment/attempt/${attemptId}`,
    placementResults: (attemptId: string) =>
      `${base}/placement/assessment/results/${attemptId}`,
    mockInterview: `${base}/placement/mock-interview`,
  };
};

/** The My Courses grid — where a signed-in user lands. */
export const MY_COURSES_ROUTE = "/dashboard";

/**
 * Course id out of a /dashboard/<courseId>/... path.
 *
 * The sidebar renders above the page that owns the route param, so it can't
 * use useParams() and reads the pathname instead. Returns null on /dashboard
 * itself and on /dashboard/learning, neither of which is course-scoped.
 */
export function courseIdFromPathname(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] !== "dashboard") return null;
  const candidate = segments[1];
  if (!candidate || candidate === "learning") return null;
  return candidate;
}
