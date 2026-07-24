import prisma from "@root/prisma.js";
import {
  createBunnyVideo,
  deleteBunnyVideo,
  getBunnyEmbedUrl,
  getBunnySignedEmbedUrl,
  getBunnyThumbnailUrl,
  getBunnyDirectUploadUrl,
} from "@/utils/bunny.js";

export class AdminIntroVideoService {
  getIntroVideo() {
    return prisma.introVideo.findFirst({ orderBy: { createdAt: "desc" } });
  }

  // Step 1: create a Bunny slot, return credentials for the client to upload directly
  async initUpload(title: string) {
    const videoInfo = await createBunnyVideo(title);
    return getBunnyDirectUploadUrl(videoInfo.guid); // { videoGuid, uploadUrl, accessKey }
  }

  // Step 2: client finished uploading directly to Bunny; replace the singleton row
  async completeUpload(videoGuid: string, title: string, fileSizeBytes: number) {
    const existing = await prisma.introVideo.findFirst();
    if (existing?.bunnyVideoId) {
      await deleteBunnyVideo(existing.bunnyVideoId).catch(() => {});
    }
    if (existing) {
      await prisma.introVideo.delete({ where: { id: existing.id } });
    }

    const embedUrl = getBunnyEmbedUrl(videoGuid);
    const thumbnailUrl = getBunnyThumbnailUrl(videoGuid);

    return prisma.introVideo.create({
      data: {
        title,
        bunnyVideoId: videoGuid,
        url: embedUrl,
        thumbnailUrl: thumbnailUrl || undefined,
        sizeBytes: fileSizeBytes.toString(),
      },
    });
  }
}

export class PublicIntroVideoService {
  async getPlaybackForUser(userId: string) {
    const video = await prisma.introVideo.findFirst({
      orderBy: { createdAt: "desc" },
    });
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isIntroVideoWatched: true },
    });

    if (!video?.bunnyVideoId) {
      return { video: null, alreadyWatched: user?.isIntroVideoWatched ?? false };
    }

    const expiresInSeconds = 2 * 60;
    return {
      video: {
        title: video.title,
        embedUrl: getBunnySignedEmbedUrl(video.bunnyVideoId, expiresInSeconds),
        expiresInSeconds,
      },
      alreadyWatched: user?.isIntroVideoWatched ?? false,
    };
  }

  async markWatched(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { isIntroVideoWatched: true, introVideoWatchedAt: new Date() },
      select: { id: true, isIntroVideoWatched: true, introVideoWatchedAt: true },
    });
  }
}
