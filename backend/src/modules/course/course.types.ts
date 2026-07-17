export type CourseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface WhatYouLearnItem {
    title: string;
    body: string;
}

export interface AudienceItem {
    title: string;
    body: string;
}

export interface CreateCategoryBody {
    name: string;
    slug: string;
    description?: string;
    thumbnail?: string;
}

export interface CreateCourseBody {
    categoryId: string;
    title: string;
    description?: string;
    thumbnail?: string;
    heroImage?: string;
    bannerImage?: string;
    level: CourseLevel;
    price?: number;
    totalWeeks?: number;
    tools?: string[];
    sessions?: string;
    certificate?: boolean;
    rating?: number;
    reviews?: string;
    startDate?: string;
    seats?: string;
    whatYouLearn?: WhatYouLearnItem[];
    audience?: AudienceItem[];
    isDirect2HireCourse?: boolean;
}

export interface UpdateCourseBody {
    categoryId?: string;
    title?: string;
    description?: string;
    thumbnail?: string;
    heroImage?: string;
    bannerImage?: string;
    level?: CourseLevel;
    price?: number;
    totalWeeks?: number;
    isPublished?: boolean;
    tools?: string[];
    sessions?: string;
    certificate?: boolean;
    rating?: number;
    reviews?: string;
    startDate?: string;
    seats?: string;
    whatYouLearn?: WhatYouLearnItem[];
    audience?: AudienceItem[];
    isDirect2HireCourse?: boolean;
}

export interface CreateLessonBody {
    weekNumber: number;
    title: string;
    description?: string;
    modules?: string[];
    duration?: number;
    lessonOrder: number;
    releaseDate?: string;
    isPublished?: boolean;
    isFreePreview?: boolean;
}

export interface UpdateLessonBody {
    weekNumber?: number;
    title?: string;
    description?: string;
    modules?: string[];
    duration?: number;
    lessonOrder?: number;
    releaseDate?: string;
    isPublished?: boolean;
    isFreePreview?: boolean;
}

export interface CreateTopicBody {
    title: string;
    description?: string;
    topicOrder: number;
    duration?: number;
}

export interface UpdateTopicBody {
    title?: string;
    description?: string;
    topicOrder?: number;
    duration?: number;
}

export interface CompleteFileUploadBody {
    title: string;
    url: string;
    size?: number;
    type: string;
}
