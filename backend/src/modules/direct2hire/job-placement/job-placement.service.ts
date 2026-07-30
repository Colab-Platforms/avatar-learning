import prisma from "@root/prisma.js";
import type { JobPlacementEntry } from "@prisma/client";
import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import type {
  CreateJobPlacementEntryInput,
  JobPlacementEntryResponse,
  JobPlacementJourneyBundle,
  UpdateJobPlacementEntryInput,
} from "./job-placement.types.js";

function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function emptyToNull(value: string | null | undefined): string | null {
  if (value == null || value.trim() === "") return null;
  return value.trim();
}

function serialize(entry: JobPlacementEntry): JobPlacementEntryResponse {
  return {
    id: entry.id,
    userId: entry.userId,
    companyName: entry.companyName,
    jobTitle: entry.jobTitle,
    location: entry.location,
    ctcLpa: entry.ctcLpa,
    joinedAt: entry.joinedAt.toISOString(),
    leftAt: toIso(entry.leftAt),
    isCurrent: entry.leftAt === null,
    notes: entry.notes,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: (entry.updatedAt ?? entry.createdAt).toISOString(),
  };
}

export class JobPlacementService {
  async canManage(userId: string): Promise<boolean> {
    const interview = await prisma.mockInterview.findUnique({
      where: { userId },
      select: { completedAt: true },
    });
    return !!interview?.completedAt;
  }

  async getJourney(userId: string): Promise<JobPlacementJourneyBundle> {
    const [canManage, entries] = await Promise.all([
      this.canManage(userId),
      prisma.jobPlacementEntry.findMany({
        where: { userId },
        orderBy: { joinedAt: "asc" },
      }),
    ]);

    return { canManage, entries: entries.map(serialize) };
  }

  async create(userId: string, data: CreateJobPlacementEntryInput) {
    if (!(await this.canManage(userId))) {
      throw new ApiError(
        "Complete your mock interview before logging a placement",
        STATUS_CODES.FORBIDDEN,
      );
    }

    const joinedAt = new Date(data.joinedAt);

    const entry = await prisma.$transaction(async (tx) => {
      const openEntry = await tx.jobPlacementEntry.findFirst({
        where: { userId, leftAt: null },
      });

      if (openEntry) {
        if (joinedAt < openEntry.joinedAt) {
          throw new ApiError(
            "New role's start date cannot be before your current role's start date",
            STATUS_CODES.BAD_REQUEST,
          );
        }
        // Logging a new role auto-closes the previously open one — that's the job switch.
        await tx.jobPlacementEntry.update({
          where: { id: openEntry.id },
          data: { leftAt: joinedAt },
        });
      }

      return tx.jobPlacementEntry.create({
        data: {
          userId,
          companyName: data.companyName.trim(),
          jobTitle: data.jobTitle.trim(),
          location: emptyToNull(data.location),
          ctcLpa: data.ctcLpa ?? null,
          joinedAt,
          notes: emptyToNull(data.notes),
        },
      });
    });

    return serialize(entry);
  }

  async update(userId: string, entryId: string, data: UpdateJobPlacementEntryInput) {
    const existing = await prisma.jobPlacementEntry.findUnique({ where: { id: entryId } });
    if (!existing || existing.userId !== userId) {
      throw new ApiError("Placement entry not found", STATUS_CODES.NOT_FOUND);
    }

    const joinedAt = data.joinedAt ? new Date(data.joinedAt) : existing.joinedAt;
    const leftAt =
      data.leftAt === undefined
        ? existing.leftAt
        : data.leftAt === null
          ? null
          : new Date(data.leftAt);

    if (leftAt && leftAt < joinedAt) {
      throw new ApiError("End date cannot be before start date", STATUS_CODES.BAD_REQUEST);
    }

    const entry = await prisma.jobPlacementEntry.update({
      where: { id: entryId },
      data: {
        companyName: data.companyName?.trim() ?? existing.companyName,
        jobTitle: data.jobTitle?.trim() ?? existing.jobTitle,
        location: data.location !== undefined ? emptyToNull(data.location) : existing.location,
        ctcLpa: data.ctcLpa !== undefined ? data.ctcLpa : existing.ctcLpa,
        joinedAt,
        leftAt,
        notes: data.notes !== undefined ? emptyToNull(data.notes) : existing.notes,
      },
    });

    return serialize(entry);
  }

  async remove(userId: string, entryId: string) {
    const existing = await prisma.jobPlacementEntry.findUnique({ where: { id: entryId } });
    if (!existing || existing.userId !== userId) {
      throw new ApiError("Placement entry not found", STATUS_CODES.NOT_FOUND);
    }
    await prisma.jobPlacementEntry.delete({ where: { id: entryId } });
  }
}
