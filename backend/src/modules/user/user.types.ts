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
    profileImage: true,
    resumeUrl: true,
    resumePublicId: true,
    currentStudyLevel: true,
    authProvider: true,
    isEmailVerified: true,
    isPhoneVerified: true,
    isActive: true,
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

export interface UpdateUserBody {
    firstName?: string;
    lastName?: string;
    phoneNo?: string;
    address?: string;
    gender?: string;
    state?: string;
    country?: string;
    isActive?: boolean;
    isPhoneVerified?: boolean;
}

export type Role = "USER" | "ADMIN" | "SUPERADMIN";

export const ROLE_LEVEL: Record<string, number> = {
    USER: 1,
    ADMIN: 2,
    SUPERADMIN: 3,
};
