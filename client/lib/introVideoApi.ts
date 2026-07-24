import apiClient from "./apiClient";

export interface IntroVideoPlayback {
  video: {
    title: string;
    embedUrl: string;
    expiresInSeconds: number;
  } | null;
  alreadyWatched: boolean;
}

export const fetchIntroVideo = (): Promise<IntroVideoPlayback> =>
  apiClient.get("/intro-video").then((r) => r.data.data);

export const markIntroVideoWatched = (): Promise<void> =>
  apiClient.post("/intro-video/watch").then((r) => r.data.data);
