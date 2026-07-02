import apiClient from "./apiClient";
import axios from "axios";
import type { PaginatedResponse } from "./coursesApi";

// ─── Categories ───────────────────────────────────────────────────────────────

export const fetchCategories = () =>
    apiClient.get("/admin/categories").then((r) => r.data.data);

export const createCategory = (payload: {
    name: string;
    slug: string;
    description?: string;
    thumbnail?: string;
}) => apiClient.post("/admin/categories", payload).then((r) => r.data.data);

// ─── Courses ──────────────────────────────────────────────────────────────────

export const fetchAdminCourses = () =>
    apiClient.get("/admin/courses").then((r) => r.data.data.data ?? r.data.data);

export const fetchAdminCoursesPaginated = (page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<any>> =>
    apiClient.get("/admin/courses", { params: { page, pageSize } }).then((r) => r.data.data);

export const fetchAdminCourse = (id: string) =>
    apiClient.get(`/admin/courses/${id}`).then((r) => r.data.data);

export const createCourse = (payload: {
    categoryId: string;
    title: string;
    description?: string;
    thumbnail?: string;
    level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
    price?: number;
    totalWeeks?: number;
}) => apiClient.post("/admin/courses", payload).then((r) => r.data.data);

export const updateCourse = (id: string, payload: Record<string, unknown>) =>
    apiClient.put(`/admin/courses/${id}`, payload).then((r) => r.data.data);

export const deleteCourse = (id: string) =>
    apiClient.delete(`/admin/courses/${id}`).then((r) => r.data);

export const toggleCoursePublish = (id: string) =>
    apiClient.patch(`/admin/courses/${id}/publish`).then((r) => r.data.data);

// ─── Lessons ──────────────────────────────────────────────────────────────────

export const createLesson = (
    courseId: string,
    payload: {
        weekNumber: number;
        title: string;
        description?: string;
        modules?: string[];
        lessonOrder: number;
        isFreePreview?: boolean;
    }
) =>
    apiClient
        .post(`/admin/courses/${courseId}/lessons`, payload)
        .then((r) => r.data.data);

export const updateLesson = (lessonId: string, payload: Record<string, unknown>) =>
    apiClient.put(`/admin/lessons/${lessonId}`, payload).then((r) => r.data.data);

export const deleteLesson = (lessonId: string) =>
    apiClient.delete(`/admin/lessons/${lessonId}`).then((r) => r.data);

// ─── Video Upload (two-step direct upload) ───────────────────────────────────

interface InitUploadResult {
    videoGuid: string;
    uploadUrl: string;
    accessKey: string;
}

// Step 1: create the Bunny slot
const initVideoUpload = (lessonId: string, title: string): Promise<InitUploadResult> =>
    apiClient.post(`/admin/lessons/${lessonId}/video/init`, { title }).then((r) => r.data.data);

// Step 2: upload the file directly to Bunny via XHR (for progress events)
const uploadDirectToBunny = (
    uploadUrl: string,
    accessKey: string,
    file: File,
    onProgress?: (pct: number) => void
): Promise<void> =>
    new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("AccessKey", accessKey);
        xhr.setRequestHeader("Content-Type", "application/octet-stream");
        xhr.upload.onprogress = (e) => {
            if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Bunny upload failed: ${xhr.statusText}`)));
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(file);
    });

// Step 3: tell the backend to save the resource record
const completeVideoUpload = (lessonId: string, videoGuid: string, title: string, fileSize: number) =>
    apiClient
        .post(`/admin/lessons/${lessonId}/video/complete`, { videoGuid, title, fileSize })
        .then((r) => r.data.data);

// All-in-one helper used by the UI
export const uploadVideo = async (
    lessonId: string,
    file: File,
    title: string,
    onProgress?: (pct: number) => void
) => {
    const { videoGuid, uploadUrl, accessKey } = await initVideoUpload(lessonId, title);
    await uploadDirectToBunny(uploadUrl, accessKey, file, onProgress);
    return completeVideoUpload(lessonId, videoGuid, title, file.size);
};

export const deleteResource = (resourceId: string) =>
    apiClient.delete(`/admin/resources/${resourceId}`).then((r) => r.data);

// ─── Course Image Upload (signed direct upload to Cloudinary) ─────────────────

export const uploadCourseImage = async (file: File): Promise<string> => {
    const { data: signRes } = await apiClient.get<{ success: boolean; data: {
        timestamp: number; signature: string; apiKey: string; cloudName: string; folder: string;
    } }>("/admin/courses/images/sign");
    const { timestamp, signature, apiKey, cloudName, folder } = signRes.data;
    const form = new FormData();
    form.append("file", file);
    form.append("api_key", apiKey);
    form.append("timestamp", String(timestamp));
    form.append("signature", signature);
    form.append("folder", folder);
    const res = await axios.post<{ secure_url: string }>(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        form
    );
    return res.data.secure_url;
};

// ─── Internships ──────────────────────────────────────────────────────────────

export const fetchAdminInternships = () =>
    apiClient.get("/admin/internships").then((r) => r.data.data.data ?? r.data.data);

export const fetchAdminInternshipsPaginated = (page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<any>> =>
    apiClient.get("/admin/internships", { params: { page, pageSize } }).then((r) => r.data.data);

export const fetchAdminInternship = (id: string) =>
    apiClient.get(`/admin/internships/${id}`).then((r) => r.data.data);

export const createInternship = (payload: {
    categoryId: string;
    title: string;
    company: string;
    description?: string;
    domain?: string;
    stipend?: string;
    employmentType: "FULL_TIME" | "PART_TIME" | "REMOTE";
    location?: string;
    deadline?: string;
}) => apiClient.post("/admin/internships", payload).then((r) => r.data.data);

export const updateInternship = (id: string, payload: Record<string, unknown>) =>
    apiClient.put(`/admin/internships/${id}`, payload).then((r) => r.data.data);

export const deleteInternship = (id: string) =>
    apiClient.delete(`/admin/internships/${id}`).then((r) => r.data);

export const toggleInternshipPublish = (id: string) =>
    apiClient.patch(`/admin/internships/${id}/publish`).then((r) => r.data.data);
