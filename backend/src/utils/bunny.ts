import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";

const BUNNY_STREAM_BASE = "https://video.bunnycdn.com/library";

const getLibraryId = (): string => {
    const id = process.env.BUNNY_LIBRARY_ID;
    if (!id) throw new ApiError("BUNNY_LIBRARY_ID is not configured", STATUS_CODES.SERVER_ERROR);
    return id;
};

const getApiKey = (): string => {
    const key = process.env.BUNNY_API_KEY;
    if (!key) throw new ApiError("BUNNY_API_KEY is not configured", STATUS_CODES.SERVER_ERROR);
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
export const createBunnyVideo = async (title: string): Promise<BunnyVideoInfo> => {
    const libraryId = getLibraryId();
    const response = await fetch(`${BUNNY_STREAM_BASE}/${libraryId}/videos`, {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({ title }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new ApiError(`Failed to create Bunny video: ${text}`, STATUS_CODES.SERVER_ERROR);
    }

    return response.json() as Promise<BunnyVideoInfo>;
};

export interface BunnyDirectUpload {
    videoGuid: string;
    uploadUrl: string;
    accessKey: string;
}

// Returns everything the client needs to PUT the file directly to Bunny (no server RAM used)
export const getBunnyDirectUploadUrl = (videoGuid: string): BunnyDirectUpload => {
    const libraryId = getLibraryId();
    return {
        videoGuid,
        uploadUrl: `${BUNNY_STREAM_BASE}/${libraryId}/videos/${videoGuid}`,
        accessKey: getApiKey(),
    };
};

export const deleteBunnyVideo = async (videoGuid: string): Promise<void> => {
    const libraryId = getLibraryId();
    const response = await fetch(`${BUNNY_STREAM_BASE}/${libraryId}/videos/${videoGuid}`, {
        method: "DELETE",
        headers: jsonHeaders(),
    });

    if (!response.ok && response.status !== 404) {
        const text = await response.text();
        throw new ApiError(`Failed to delete Bunny video: ${text}`, STATUS_CODES.SERVER_ERROR);
    }
};

export const getBunnyVideoInfo = async (videoGuid: string): Promise<BunnyVideoInfo> => {
    const libraryId = getLibraryId();
    const response = await fetch(`${BUNNY_STREAM_BASE}/${libraryId}/videos/${videoGuid}`, {
        headers: jsonHeaders(),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new ApiError(`Failed to get Bunny video info: ${text}`, STATUS_CODES.SERVER_ERROR);
    }

    return response.json() as Promise<BunnyVideoInfo>;
};

export const getBunnyEmbedUrl = (videoGuid: string): string => {
    const libraryId = getLibraryId();
    return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoGuid}`;
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
export const getBunnyMp4Url = (videoGuid: string, resolution: 720 | 1080 | 480 = 720): string => {
    const hostname = process.env.BUNNY_CDN_HOSTNAME;
    if (!hostname) return "";
    return `https://${hostname}/${videoGuid}/play_${resolution}p.mp4`;
};
