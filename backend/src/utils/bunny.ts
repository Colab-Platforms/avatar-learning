import { createHash } from "node:crypto";
import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";

const BUNNY_STREAM_BASE = "https://video.bunnycdn.com/library";

const getLibraryId = (): string => {
  const id = process.env.BUNNY_LIBRARY_ID;
  if (!id)
    throw new ApiError(
      "BUNNY_LIBRARY_ID is not configured",
      STATUS_CODES.SERVER_ERROR,
    );
  return id;
};

const getApiKey = (): string => {
  const key = process.env.BUNNY_API_KEY;
  if (!key)
    throw new ApiError(
      "BUNNY_API_KEY is not configured",
      STATUS_CODES.SERVER_ERROR,
    );
  return key;
};

const jsonHeaders = () => ({
  AccessKey: getApiKey(),
  "Content-Type": "application/json",
  Accept: "application/json",
});

export interface BunnyVideoInfo {
  videoLibraryId: number;
  guid: string;
  title: string;
  status: number;
  length: number;
  width: number;
  height: number;
  storageSize: number;
}

//return  videoGUID to create a slot in bunny.net
export const createBunnyVideo = async (
  title: string,
): Promise<BunnyVideoInfo> => {
  const libraryId = getLibraryId();
  const response = await fetch(`${BUNNY_STREAM_BASE}/${libraryId}/videos`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(
      `Failed to create Bunny video: ${text}`,
      STATUS_CODES.SERVER_ERROR,
    );
  }

  return response.json() as Promise<BunnyVideoInfo>;
};

export interface BunnyDirectUpload {
  videoGuid: string;
  uploadUrl: string;
  accessKey: string;
}

// Returns everything the client needs to PUT the file directly to Bunny (no server RAM used)
export const getBunnyDirectUploadUrl = (
  videoGuid: string,
): BunnyDirectUpload => {
  const libraryId = getLibraryId();
  return {
    videoGuid,
    uploadUrl: `${BUNNY_STREAM_BASE}/${libraryId}/videos/${videoGuid}`,
    accessKey: getApiKey(),
  };
};

export const deleteBunnyVideo = async (videoGuid: string): Promise<void> => {
  const libraryId = getLibraryId();
  const response = await fetch(
    `${BUNNY_STREAM_BASE}/${libraryId}/videos/${videoGuid}`,
    {
      method: "DELETE",
      headers: jsonHeaders(),
    },
  );

  if (!response.ok && response.status !== 404) {
    const text = await response.text();
    throw new ApiError(
      `Failed to delete Bunny video: ${text}`,
      STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const getBunnyVideoInfo = async (
  videoGuid: string,
): Promise<BunnyVideoInfo> => {
  const libraryId = getLibraryId();
  const response = await fetch(
    `${BUNNY_STREAM_BASE}/${libraryId}/videos/${videoGuid}`,
    {
      headers: jsonHeaders(),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(
      `Failed to get Bunny video info: ${text}`,
      STATUS_CODES.SERVER_ERROR,
    );
  }

  return response.json() as Promise<BunnyVideoInfo>;
};

export const getBunnyEmbedUrl = (videoGuid: string): string => {
  const libraryId = getLibraryId();
  return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoGuid}`;
};

/** Default signed-embed lifetime (4 hours). */
export const DEFAULT_EMBED_TOKEN_TTL_SECONDS = 2 * 60 * 60; // 2 hours

const isEmbedTokenAuthEnabled = (): boolean =>
  process.env.BUNNY_EMBED_TOKEN_AUTH === "true";

/**
 * Bunny Stream embed token: SHA256_HEX(token_security_key + video_id + expiration)
 * Only used when "Embed view token authentication" is ON in Bunny dashboard.
 * @see https://docs.bunny.net/stream/token-authentication
 */
export const generateBunnyEmbedToken = (
  videoGuid: string,
  expiresAtUnixSeconds: number,
): string => {
  const securityKey = process.env.BUNNY_TOKEN_SECURITY_KEY;
  if (!securityKey) {
    throw new ApiError(
      "BUNNY_TOKEN_SECURITY_KEY is not configured",
      STATUS_CODES.SERVER_ERROR,
    );
  }

  return createHash("sha256")
    .update(`${securityKey}${videoGuid}${expiresAtUnixSeconds}`)
    .digest("hex");
};

/**
 * Returns an iframe embed URL.
 * - Embed view token auth OFF (default): plain URL — Bunny player signs CDN requests itself.
 * - Embed view token auth ON: append ?token=&expires= (set BUNNY_EMBED_TOKEN_AUTH=true).
 */
export const getBunnySignedEmbedUrl = (
  videoGuid: string,
  expiresInSeconds = DEFAULT_EMBED_TOKEN_TTL_SECONDS,
): string => {
  const baseUrl = getBunnyEmbedUrl(videoGuid);

  if (!isEmbedTokenAuthEnabled()) return baseUrl;

  const securityKey = process.env.BUNNY_TOKEN_SECURITY_KEY;
  if (!securityKey) {
    throw new ApiError(
      "BUNNY_EMBED_TOKEN_AUTH is enabled but BUNNY_TOKEN_SECURITY_KEY is missing",
      STATUS_CODES.SERVER_ERROR,
    );
  }

  const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const token = generateBunnyEmbedToken(videoGuid, expires);
  return `${baseUrl}?token=${token}&expires=${expires}`;
};

export const getBunnyThumbnailUrl = (videoGuid: string): string => {
  const hostname = process.env.BUNNY_CDN_HOSTNAME;
  if (!hostname) return "";
  return `https://${hostname}/${videoGuid}/thumbnail.jpg`;
};

export const getBunnyHlsUrl = (videoGuid: string): string => {
  const hostname = process.env.BUNNY_CDN_HOSTNAME;
  if (!hostname) return "";
  return `https://${hostname}/${videoGuid}/playlist.m3u8`;
};

// Direct MP4 download URL from Bunny CDN pull zone
export const getBunnyMp4Url = (
  videoGuid: string,
  resolution: 720 | 1080 | 480 = 720,
): string => {
  const hostname = process.env.BUNNY_CDN_HOSTNAME;
  if (!hostname) return "";
  return `https://${hostname}/${videoGuid}/play_${resolution}p.mp4`;
};
