import type { CourseTier } from "@prisma/client";

/**
 * Which content tiers a student holding `enrolledTier` is allowed to see.
 *
 * The two plans are deliberately NOT nested: ₹499 and ₹4999 have entirely
 * different videos and assessments, so a D2H student sees the D2H track only —
 * the Basic weeks are a different, shorter course, not a subset of theirs.
 * BOTH is the escape hatch for the occasional item that genuinely belongs to
 * each plan.
 *
 * Single source of truth on purpose: lessons, assessments and progress all
 * read from here, and letting any one of them drift produces a student who can
 * see a lesson but not its quiz (or worse, the reverse).
 */
export function tierFilterFor(enrolledTier: CourseTier): {
  in: CourseTier[];
} {
  if (enrolledTier === "BASIC") {
    return { in: ["BASIC", "BOTH"] };
  }
  return { in: ["D2H", "BOTH"] };
}
