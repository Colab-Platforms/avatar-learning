import prisma from "@root/prisma.js";
import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";

/**
 * Course-facing routes are addressed by slug in most of the app, but a handful
 * of older callers still pass the raw id — accept either. Used by any service
 * that needs to turn a `:courseId` param (which may actually hold a slug) into
 * the real course id before using it in a Prisma filter.
 */
function isCourseUuidOrCuid(slugOrId: string): boolean {
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId) ||
    /^[a-z0-9]{20,}$/.test(slugOrId)
  );
}

/** Accepts either a UUID/cuid (course id) or a slug — always returns the course record. */
export async function resolveCourseRecord(slugOrId: string) {
  const course = isCourseUuidOrCuid(slugOrId)
    ? await prisma.courses.findFirst({
        where: { OR: [{ id: slugOrId }, { slug: slugOrId }], isPublished: true },
      })
    : await prisma.courses.findUnique({ where: { slug: slugOrId, isPublished: true } });

  if (!course) throw new ApiError("Course not found", STATUS_CODES.NOT_FOUND);
  return course;
}

/** Same as resolveCourseRecord but returns just the id, for callers that only need it for a filter. */
export async function resolveCourseId(slugOrId: string): Promise<string> {
  const course = await resolveCourseRecord(slugOrId);
  return course.id;
}
