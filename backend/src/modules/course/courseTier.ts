import type { CourseTier } from "@prisma/client";
import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";

/**
 * A single track a student can be studying in. Never BOTH — BOTH is an
 * entitlement ("owns each plan"), not something you can be looking at.
 */
export type CourseTrack = "BASIC" | "D2H";

/**
 * The two plans are deliberately NOT nested: ₹499 and ₹4999 have entirely
 * different videos and assessments, so a D2H student sees the D2H track only —
 * the Basic weeks are a different, shorter course, not a subset of theirs. A
 * student who bought both studies them one at a time, which is why every read
 * takes a track rather than deriving a filter from the enrolment tier.
 *
 * BOTH means different things on each side, deliberately:
 *   - on a content row (lesson/assessment) it is the escape hatch for the
 *     occasional item that genuinely belongs to each plan — so it appears in
 *     both tracks;
 *   - on an enrolment (CourseUserMapper.tier) it means the student bought both
 *     plans: they upgraded from ₹499 and paid the full ₹4999.
 *
 * Single source of truth on purpose: lessons, assessments and progress all read
 * from here, and letting any one of them drift produces a student who can see a
 * lesson but not its quiz (or worse, the reverse).
 */
export function contentFilterForTrack(track: CourseTrack): {
  in: CourseTier[];
} {
  return { in: [track, "BOTH"] };
}

/**
 * Every content tier the enrolment entitles the student to, across all their
 * tracks. For entitlement checks ("may they open this assessment at all?") —
 * listings should filter by a single track instead.
 */
export function ownedContentTiers(enrolledTier: CourseTier): CourseTier[] {
  if (enrolledTier === "BOTH") return ["BASIC", "D2H", "BOTH"];
  return [enrolledTier, "BOTH"];
}

/** Which tracks an enrolment entitles the student to. */
export function tracksFor(enrolledTier: CourseTier): CourseTrack[] {
  if (enrolledTier === "BOTH") return ["BASIC", "D2H"];
  return [enrolledTier];
}

/**
 * Resolve a requested `?track=` against what the student actually owns.
 *
 * With no request we fall back to the track a single-plan student has, and to
 * D2H for someone who owns both — that keeps every pre-existing link and
 * bookmark landing exactly where it did before tracks were addressable.
 */
export function resolveTrack(
  enrolledTier: CourseTier,
  requested?: string | null,
): CourseTrack {
  const owned = tracksFor(enrolledTier);

  if (requested) {
    const normalized = requested.toUpperCase();
    if (normalized !== "BASIC" && normalized !== "D2H") {
      throw new ApiError(
        "Unknown track. Expected 'basic' or 'd2h'.",
        STATUS_CODES.BAD_REQUEST,
      );
    }
    if (!owned.includes(normalized)) {
      throw new ApiError(
        normalized === "D2H"
          ? "You have not enrolled in the Direct2Hire programme for this course"
          : "You have not enrolled in the Basic plan for this course",
        STATUS_CODES.FORBIDDEN,
      );
    }
    return normalized;
  }

  return owned.includes("D2H") ? "D2H" : "BASIC";
}
