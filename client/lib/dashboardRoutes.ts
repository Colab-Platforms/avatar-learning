/**
 * The Direct2Hire journey is per-course now, so every dashboard link needs the
 * course it belongs to. Building them in one place keeps the ~60 call sites
 * from drifting, and makes the next route change a single edit.
 */
export const dashboardRoutes = (courseId: string) => {
  const base = `/dashboard/${courseId}`;
  return {
    // The overview is the one route both plans share, so it names its track.
    // Everything below is Direct2Hire-only and needs no marker.
    root: `${base}?track=d2h`,
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

/**
 * Routes for a ₹499 Basic course — only learning + certification.
 *
 * `?track=basic` is carried explicitly rather than inferred: a student who
 * upgraded owns both plans, and without it these paths are ambiguous. Links
 * built before tracks existed keep working — the server falls back to the
 * track such a student would have seen anyway.
 */
export const basicCourseRoutes = (courseId: string) => {
  const base = `/dashboard/${courseId}`;
  const q = `?${TRACK_PARAM}=basic`;
  return {
    root: `${base}${q}`,
    learn: `${base}/learn${q}`,
    certificate: `${base}/certificate${q}`,
  };
};

export const TRACK_PARAM = "track";

export type DashboardTrack = "BASIC" | "D2H";

/**
 * Which plan a dashboard path belongs to, or null when it works for either.
 *
 * The two plans are separate purchases, so a Basic student must not reach the
 * Direct2Hire journey and a Direct2Hire student must not reach the Basic
 * course. This is the single answer the layout guard enforces; the server
 * enforces the same rule on the data itself.
 */
export function requiredTrackForPath(
  pathname: string,
  courseId: string | null,
  requestedTrack: DashboardTrack | null,
): DashboardTrack | null {
  // The Direct2Hire learning subtree.
  if (pathname === "/dashboard/learning" || pathname.startsWith("/dashboard/learning/")) {
    return "D2H";
  }
  if (!courseId) return null;

  const base = `/dashboard/${courseId}`;
  // Basic students only ever get these two.
  if (
    pathname === `${base}/learn` ||
    pathname.startsWith(`${base}/learn/`) ||
    pathname === `${base}/certificate`
  ) {
    return "BASIC";
  }
  // The overview serves both plans and says which one it means.
  if (pathname === base) return requestedTrack;
  // Everything else under a course — assessment, counselling, internships,
  // placement — is the Direct2Hire journey.
  return "D2H";
}

/** Track a /dashboard URL is addressing, if it says. */
export function trackFromSearchParams(
  params: { get(key: string): string | null } | null | undefined,
): "BASIC" | "D2H" | null {
  const raw = params?.get(TRACK_PARAM)?.toUpperCase();
  return raw === "BASIC" || raw === "D2H" ? raw : null;
}

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
