export const userSelectFields = {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    phoneNo: true,
    address: true,
    gender: true,
    state: true,
    country: true,
    city: true,
    dateOfBirth: true,
    profileImage: true,
    profileImagePublicId: true,
    resumeUrl: true,
    resumePublicId: true,
    currentStudyLevel: true,
    authProvider: true,
    profileCompleted: true,
    isEmailVerified: true,
    isPhoneVerified: true,
    isActive: true,
    quizCompleted: true,
    quizCompletedAt: true,
    quizPrimaryCareerDomain: true,
    quizSecondaryCareerDomain: true,
    quizRecommendedCareer: true,
    quizMatchPercentage: true,
    createdAt: true,
    updatedAt: true,
    userRoleMappings: {
        select: {
            role: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    },
};

export interface CreateUserBody {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNo?: string;
}

export interface SetUserRoleBody {
    role: "ADMIN" | "USER";
}

export interface UpdateUserBody {
    firstName?: string;
    lastName?: string;
    phoneNo?: string;
    address?: string;
    gender?: string;
    state?: string;
    country?: string;
    city?: string;
    isActive?: boolean;
    isPhoneVerified?: boolean;
}

export interface CompleteQuizBody {
    primaryCareerDomain: string;
    secondaryCareerDomain?: string | null;
    recommendedCareer: string;
    matchPercentage: number;
    answers: Record<string, { question: string; selected: string[] }>;
    domainScores: Record<string, number>;
}

export type Role = "USER" | "ADMIN" | "SUPERADMIN";

export const ROLE_LEVEL: Record<string, number> = {
    USER: 1,
    ADMIN: 2,
    SUPERADMIN: 3,
};
