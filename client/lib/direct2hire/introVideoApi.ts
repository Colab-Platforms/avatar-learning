import apiClient from "@/lib/apiClient";

export interface IntroVideoMeta {
  id: string;
  title: string;
  bunnyVideoId: string | null;
  thumbnailUrl: string | null;
  sizeBytes: string | null;
  createdAt: string;
  updatedAt: string;
  hasVideo: boolean;
  durationSeconds?: number | null;
}

export interface StudentIntroVideoResponse {
  video: IntroVideoMeta | null;
  isIntroVideoWatched: boolean;
  introVideoWatchedAt: string | null;
}

export interface IntroPlaybackResponse {
  embedUrl: string;
  expiresInSeconds: number;
  title: string;
  thumbnailUrl: string | null;
}

export const fetchIntroVideo = (): Promise<StudentIntroVideoResponse> =>
  apiClient.get("/direct2hire/intro-video").then((r) => r.data.data);

export const fetchIntroPlaybackUrl = (): Promise<IntroPlaybackResponse> =>
  apiClient
    .get("/direct2hire/intro-video/playback")
    .then((r) => r.data.data);

export const markIntroVideoComplete = (): Promise<{
  isIntroVideoWatched: boolean;
  introVideoWatchedAt: string | null;
}> =>
  apiClient
    .post("/direct2hire/intro-video/complete")
    .then((r) => r.data.data);

// ─── Admin ───────────────────────────────────────────────────────────────────

export const fetchAdminIntroVideo = (): Promise<IntroVideoMeta | null> =>
  apiClient.get("/admin/direct2hire/intro-video").then((r) => r.data.data);

const initIntroVideoUpload = (
  title: string,
): Promise<{ videoGuid: string; uploadUrl: string; accessKey: string }> =>
  apiClient
    .post("/admin/direct2hire/intro-video/init", { title })
    .then((r) => r.data.data);

const uploadDirectToBunny = (
  uploadUrl: string,
  accessKey: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<void> =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("AccessKey", accessKey);
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    xhr.upload.onprogress = (e) => {
      if (onProgress && e.total)
        onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status < 300
        ? resolve()
        : reject(new Error(`Bunny upload failed: ${xhr.statusText}`));
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });

const completeIntroVideoUpload = (
  videoGuid: string,
  title: string,
  fileSize: number,
): Promise<IntroVideoMeta> =>
  apiClient
    .post("/admin/direct2hire/intro-video/complete", {
      videoGuid,
      title,
      fileSize,
    })
    .then((r) => r.data.data);

export const uploadIntroVideo = async (
  file: File,
  title: string,
  onProgress?: (pct: number) => void,
): Promise<IntroVideoMeta> => {
  const { videoGuid, uploadUrl, accessKey } = await initIntroVideoUpload(
    title,
  );
  await uploadDirectToBunny(uploadUrl, accessKey, file, onProgress);
  return completeIntroVideoUpload(videoGuid, title, file.size);
};

export const deleteIntroVideo = (): Promise<{ deleted: boolean }> =>
  apiClient.delete("/admin/direct2hire/intro-video").then((r) => r.data.data);
