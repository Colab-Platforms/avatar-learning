/**
 * Enrolment tier helpers. Mirrors CourseUserMapper.tier on the backend:
 * BASIC = ₹499 track, D2H = ₹4999 track, BOTH = bought both (upgraded).
 *
 * The two plans are separate tracks, not nested, so "has D2H" and "can upgrade"
 * are different questions — keep both here so every CTA agrees.
 */
export type EnrolledTier = "BASIC" | "D2H" | "BOTH";

export const hasD2H = (tier?: EnrolledTier | null): boolean =>
  tier === "D2H" || tier === "BOTH";

export const canUpgrade = (tier?: EnrolledTier | null): boolean =>
  tier === "BASIC";
