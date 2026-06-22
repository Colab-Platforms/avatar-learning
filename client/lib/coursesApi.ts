import apiClient from "./apiClient";

export interface DBCourse {
    id: string;
    title: string;
    slug: string;
    description?: string;
    thumbnail?: string;
    level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
    price: number;
    totalWeeks: number;
    isPublished: boolean;
    category: { id: string; name: string; slug: string };
    _count: { lessons: number; enrollments: number };
}

export interface DBResource {
    id: string;
    title: string;
    category: string;
    type: string;
    url: string;
    bunnyVideoId?: string;
    size?: string;
}

export interface DBLesson {
    id: string;
    weekNumber: number;
    title: string;
    description?: string;
    duration?: number;
    isPublished: boolean;
    isFreePreview: boolean;
    resources: DBResource[];
}

export interface DBCourseDetail extends DBCourse {
    lessons: DBLesson[];
}

export const fetchPublishedCourses = (): Promise<DBCourse[]> =>
    apiClient.get("/courses").then((r) => r.data.data);

export const fetchCourseBySlug = (slug: string): Promise<DBCourseDetail> =>
    apiClient.get(`/courses/${slug}`).then((r) => r.data.data);
