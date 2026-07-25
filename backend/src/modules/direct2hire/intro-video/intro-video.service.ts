import prisma from "@root/prisma.js";
import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import {
  createBunnyVideo,
  deleteBunnyVideo,
  getBunnyDirectUploadUrl,
  getBunnyEmbedUrl,
  getBunnySignedEmbedUrl,
  getBunnyThumbnailUrl,
  getBunnyVideoInfo,
} from "@/utils/bunny.js";

function serializeIntroVideo(video: {
  id: string;
  title: string;
  bunnyVideoId: string | null;
  url: string | null;
  thumbnailUrl: string | null;
  sizeBytes: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: video.id,
    title: video.title,
    bunnyVideoId: video.bunnyVideoId,
    thumbnailUrl: video.thumbnailUrl,
    sizeBytes: video.sizeBytes,
    createdAt: video.createdAt,
    updatedAt: video.updatedAt,
    hasVideo: Boolean(video.bunnyVideoId),
  };
}

export class IntroVideoService {
  private async assertPaidEnrollment(userId: string) {
    const enrollment = await prisma.direct2HireEnrollment.findFirst({
      where: { userId, status: "PAID" },
      orderBy: { createdAt: "desc" },
    });
    if (!enrollment) {
      throw new ApiError(
        "Direct2Hire enrollment required",
        STATUS_CODES.FORBIDDEN,
      );
    }
    return enrollment;
  }

  /** Singleton row — at most one active intro video. */
  async getActiveIntroVideo() {
    return prisma.introVideo.findFirst({
      orderBy: { updatedAt: "desc" },
    });
  }

  // ─── Student ───────────────────────────────────────────────────────────────

  async getStudentIntro(userId: string) {
    await this.assertPaidEnrollment(userId);

    const [video, user] = await Promise.all([
      this.getActiveIntroVideo(),
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          isIntroVideoWatched: true,
          introVideoWatchedAt: true,
        },
      }),
    ]);

    if (!user) {
      throw new ApiError("User not found", STATUS_CODES.NOT_FOUND);
    }

    return {
      video: video?.bunnyVideoId ? serializeIntroVideo(video) : null,
      isIntroVideoWatched: user.isIntroVideoWatched,
      introVideoWatchedAt: user.introVideoWatchedAt,
    };
  }

  async getPlaybackUrl(userId: string) {
    await this.assertPaidEnrollment(userId);

    const video = await this.getActiveIntroVideo();
    if (!video?.bunnyVideoId) {
      throw new ApiError(
        "Introduction video is not available yet",
        STATUS_CODES.NOT_FOUND,
      );
    }

    const expiresInSeconds = 2 * 60 * 60;
    const embedUrl = getBunnySignedEmbedUrl(
      video.bunnyVideoId,
      expiresInSeconds,
    );
    // Enable Player.js bridge for reliable completion events
    const separator = embedUrl.includes("?") ? "&" : "?";
    return {
      embedUrl: `${embedUrl}${separator}playerjs=true`,
      expiresInSeconds,
      title: video.title,
      thumbnailUrl: video.thumbnailUrl,
    };
  }

  async markCompleted(userId: string) {
    await this.assertPaidEnrollment(userId);

    const video = await this.getActiveIntroVideo();
    if (!video?.bunnyVideoId) {
      throw new ApiError(
        "Introduction video is not available yet",
        STATUS_CODES.NOT_FOUND,
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        isIntroVideoWatched: true,
        introVideoWatchedAt: true,
      },
    });
    if (!user) {
      throw new ApiError("User not found", STATUS_CODES.NOT_FOUND);
    }

    // Idempotent — already completed stays completed with original timestamp
    if (user.isIntroVideoWatched) {
      return {
        isIntroVideoWatched: true,
        introVideoWatchedAt: user.introVideoWatchedAt,
      };
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        isIntroVideoWatched: true,
        introVideoWatchedAt: new Date(),
      },
      select: {
        isIntroVideoWatched: true,
        introVideoWatchedAt: true,
      },
    });

    return updated;
  }

  // ─── Admin ─────────────────────────────────────────────────────────────────

  async getAdminIntro() {
    const video = await this.getActiveIntroVideo();
    if (!video) return null;

    let durationSeconds: number | null = null;
    if (video.bunnyVideoId) {
      try {
        const info = await getBunnyVideoInfo(video.bunnyVideoId);
        durationSeconds = info.length > 0 ? info.length : null;
      } catch {
        durationSeconds = null;
      }
    }

    return {
      ...serializeIntroVideo(video),
      durationSeconds,
    };
  }

  async initUpload(title: string) {
    const videoInfo = await createBunnyVideo(title);
    return getBunnyDirectUploadUrl(videoInfo.guid);
  }

  async completeUpload(
    videoGuid: string,
    title: string,
    fileSizeBytes: number,
  ) {
    const embedUrl = getBunnyEmbedUrl(videoGuid);
    const thumbnailUrl = getBunnyThumbnailUrl(videoGuid);
    const existing = await this.getActiveIntroVideo();

    // Replace singleton: update existing row and delete previous Bunny asset
    if (existing) {
      const previousGuid = existing.bunnyVideoId;
      const updated = await prisma.introVideo.update({
        where: { id: existing.id },
        data: {
          title,
          bunnyVideoId: videoGuid,
          url: embedUrl,
          thumbnailUrl: thumbnailUrl || null,
          sizeBytes: fileSizeBytes.toString(),
        },
      });

      if (previousGuid && previousGuid !== videoGuid) {
        await deleteBunnyVideo(previousGuid).catch(() => {});
      }

      return serializeIntroVideo(updated);
    }

    const created = await prisma.introVideo.create({
      data: {
        title,
        bunnyVideoId: videoGuid,
        url: embedUrl,
        thumbnailUrl: thumbnailUrl || null,
        sizeBytes: fileSizeBytes.toString(),
      },
    });

    return serializeIntroVideo(created);
  }

  async deleteIntro() {
    const existing = await this.getActiveIntroVideo();
    if (!existing) {
      throw new ApiError("No introduction video found", STATUS_CODES.NOT_FOUND);
    }

    if (existing.bunnyVideoId) {
      await deleteBunnyVideo(existing.bunnyVideoId).catch(() => {});
    }

    await prisma.introVideo.delete({ where: { id: existing.id } });
    return { deleted: true };
  }
}
