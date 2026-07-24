import prisma from "@root/prisma.js";
import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import { hashPassword } from "@/utils/auth.js";
import { userSelectFields, CreateUserBody, UpdateUserBody, SetUserRoleBody, Role, ROLE_LEVEL } from "./user.types.js";
import { getPaginationOptions, formatPaginationResponse } from "@/utils/paginationUtils.js";
import { buildPrismaQuery } from "prisma-qb";
import { deleteFromCloudinary, RESUME_FOLDER, PROFILE_IMAGES_FOLDER, uploadToCloudinary } from "@/utils/cloudinary.js";

const getHighestRole = (userRoleMappings: { role: { name: string } }[]): string => {
    let highest = "USER";
    for (const ur of userRoleMappings) {
        if ((ROLE_LEVEL[ur.role.name] ?? 0) > (ROLE_LEVEL[highest] ?? 0)) {
            highest = ur.role.name;
        }
    }
    return highest;
};

class UserService {
    getVisibleRoles = (callerRole: Role): string[] => {
        const callerLevel = ROLE_LEVEL[callerRole] ?? 0;
        return Object.entries(ROLE_LEVEL)
            .filter(([, level]) => level < callerLevel)
            .map(([name]) => name);
    };

    async getAllUsers(query: any, callerRole: Role, callerId: string) {
        const { take, skip, page, pageSize } = getPaginationOptions(query, 10);

        const { where: qbWhere, orderBy } = buildPrismaQuery({
            query,
            searchFields: [
                { field: "firstName" },
                { field: "lastName" },
                { field: "email" },
            ],
            filterFields: [
                { key: "isActive", field: "isActive", type: "boolean" },
                { key: "isEmailVerified", field: "isEmailVerified", type: "boolean" },
            ],
            sortFields: [
                { key: "createdAt", field: "createdAt" },
                { key: "firstName", field: "firstName" },
                { key: "email", field: "email" },
            ],
            defaultSort: { key: "createdAt", order: "desc" },
            softDelete: { field: "isDeleted", value: false },
            allowedQueryKeys: ["page", "pageSize", "search", "isActive", "isEmailVerified"],
        });

        const visibleRoles = this.getVisibleRoles(callerRole);

        const where = {
            ...qbWhere,
            id: { not: callerId },
            userRoleMappings: {
                some: { role: { name: { in: visibleRoles } } },
            },
        };

        const [users, totalRecords] = await Promise.all([
            prisma.user.findMany({ where, select: userSelectFields, skip, take, orderBy }),
            prisma.user.count({ where }),
        ]);

        return formatPaginationResponse(users, totalRecords, page, pageSize);
    }

    async getUserById(targetId: string, callerRole: Role, callerId: string) {
        const user = await prisma.user.findFirst({
            where: { id: targetId, isDeleted: false },
            select: userSelectFields,
        });

        if (!user) throw new ApiError("User not found", STATUS_CODES.NOT_FOUND);

        if (callerRole === "USER" && callerId !== targetId) {
            throw new ApiError("You can only view your own profile", STATUS_CODES.FORBIDDEN);
        }

        if (callerId !== targetId) {
            const targetHighestRole = getHighestRole(user.userRoleMappings);
            if ((ROLE_LEVEL[targetHighestRole] ?? 0) >= (ROLE_LEVEL[callerRole] ?? 0)) {
                throw new ApiError("You do not have permission to view this user", STATUS_CODES.FORBIDDEN);
            }
        }

        return user;
    }

    async createUser(data: CreateUserBody) {
        const existingUser = await prisma.user.findFirst({
            where: { email: data.email, isDeleted: false },
        });
        if (existingUser) throw new ApiError("Email already registered", STATUS_CODES.CONFLICT);

        const roleRecord = await prisma.role.findUnique({ where: { name: "USER" } });
        if (!roleRecord) throw new ApiError("USER role not found", STATUS_CODES.SERVER_ERROR);

        const hashedPassword = await hashPassword(data.password);

        const user = await prisma.$transaction(async (tx) => {
            const created = await tx.user.create({
                data: {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                    password: hashedPassword,
                    phoneNo: data.phoneNo ?? null,
                },
            });

            await tx.userRoleMapping.create({
                data: { userId: created.id, roleId: roleRecord.id },
            });

            return tx.user.findUnique({ where: { id: created.id }, select: userSelectFields });
        });

        return user;
    }

    async updateUser(targetId: string, data: UpdateUserBody, callerRole: Role, callerId: string) {
        const user = await prisma.user.findFirst({
            where: { id: targetId, isDeleted: false },
            include: { userRoleMappings: { include: { role: true } } },
        });

        if (!user) throw new ApiError("User not found", STATUS_CODES.NOT_FOUND);

        if (callerId !== targetId) {
            if (callerRole === "USER") {
                throw new ApiError("You can only update your own account", STATUS_CODES.FORBIDDEN);
            }

            const targetHighestRole = getHighestRole(user.userRoleMappings);
            if ((ROLE_LEVEL[targetHighestRole] ?? 0) >= (ROLE_LEVEL[callerRole] ?? 0)) {
                throw new ApiError("You do not have permission to update this user", STATUS_CODES.FORBIDDEN);
            }
        }

        if (callerRole === "USER" && data.isActive !== undefined) {
            throw new ApiError("You cannot change account active status", STATUS_CODES.FORBIDDEN);
        }

        const updatedUser = await prisma.user.update({
            where: { id: targetId },
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                phoneNo: data.phoneNo,
                address: data.address,
                gender: data.gender,
                state: data.state,
                country: data.country,
                city: data.city,
                ...(data.isActive !== undefined && { isActive: data.isActive }),
            },
            select: userSelectFields,
        });

        return updatedUser;
    }

    // A resume that's already been submitted with an internship application is
    // kept in Cloudinary (soft delete) so admins can still open it later, even
    // if the user replaces or removes it from their profile.
    async isResumeReferencedByApplication(publicId: string): Promise<boolean> {
        const referenced = await prisma.internshipApplication.findFirst({
            where: { resumePublicId: publicId },
            select: { id: true },
        });
        return !!referenced;// true if a record is found, false otherwise
    }

    async saveResume(userId: string, publicId: string, secureUrl: string) {
        if (!publicId.startsWith(RESUME_FOLDER + '/')) {
            throw new ApiError('Invalid resume upload', STATUS_CODES.BAD_REQUEST);
        }

        const user = await prisma.user.findFirst({ where: { id: userId, isDeleted: false } });
        if (!user) throw new ApiError('User not found', STATUS_CODES.NOT_FOUND);

        if (user.resumePublicId && user.resumePublicId !== publicId) {
            const referenced = await this.isResumeReferencedByApplication(user.resumePublicId);
            if (!referenced) {
                await deleteFromCloudinary(user.resumePublicId);
            }
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: { resumeUrl: secureUrl, resumePublicId: publicId },
            select: userSelectFields,
        });

        return updated;
    }

    async deleteResume(userId: string) {
        const user = await prisma.user.findFirst({ where: { id: userId, isDeleted: false } });
        if (!user) throw new ApiError('User not found', STATUS_CODES.NOT_FOUND);
        if (!user.resumeUrl) throw new ApiError('No resume found', STATUS_CODES.NOT_FOUND);

        if (user.resumePublicId) {
            const referenced = await this.isResumeReferencedByApplication(user.resumePublicId);
            if (!referenced) {
                await deleteFromCloudinary(user.resumePublicId);
            }
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: { resumeUrl: null, resumePublicId: null },
            select: userSelectFields,
        });

        return updated;
    }

    async uploadProfileImage(userId: string, file: Express.Multer.File) {
        const user = await prisma.user.findFirst({
            where: { id: userId, isDeleted: false },
        });
        if (!user) throw new ApiError('User not found', STATUS_CODES.NOT_FOUND);

        const previousPublicId = user.profileImagePublicId;

        let uploadResult: { url: string; public_id: string };
        try {
            uploadResult = await uploadToCloudinary(
                file.buffer,
                PROFILE_IMAGES_FOLDER,
                'image',
            );
        } catch (error) {
            throw error;
        }

        if (!uploadResult.url || !uploadResult.public_id) {
            throw new ApiError('File upload failed', STATUS_CODES.SERVER_ERROR);
        }

        if (!uploadResult.public_id.startsWith(`${PROFILE_IMAGES_FOLDER}/`)) {
            await deleteFromCloudinary(uploadResult.public_id, 'image');
            throw new ApiError('Invalid profile image upload', STATUS_CODES.BAD_REQUEST);
        }

        try {
            const updated = await prisma.user.update({
                where: { id: userId },
                data: {
                    profileImage: uploadResult.url,
                    profileImagePublicId: uploadResult.public_id,
                },
                select: userSelectFields,
            });

            if (previousPublicId) {
                await deleteFromCloudinary(previousPublicId, 'image');
            }

            return updated;
        } catch (error) {
            await deleteFromCloudinary(uploadResult.public_id, 'image');
            throw error;
        }
    }

    async removeProfileImage(userId: string) {
        const user = await prisma.user.findFirst({
            where: { id: userId, isDeleted: false },
        });
        if (!user) throw new ApiError('User not found', STATUS_CODES.NOT_FOUND);
        if (!user.profileImage) {
            throw new ApiError('No profile image found', STATUS_CODES.NOT_FOUND);
        }

        if (user.profileImagePublicId) {
            await deleteFromCloudinary(user.profileImagePublicId, 'image');
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: {
                profileImage: null,
                profileImagePublicId: null,
            },
            select: userSelectFields,
        });

        return updated;
    }

    // Only SUPERADMIN may call this (enforced at the route level too). Grants
    // or revokes ADMIN — SUPERADMIN itself can never be assigned or touched here.
    async setUserRole(targetId: string, data: SetUserRoleBody, callerRole: Role, callerId: string) {
        if (callerRole !== "SUPERADMIN") {
            throw new ApiError("You do not have permission to change user roles", STATUS_CODES.FORBIDDEN);
        }

        if (targetId === callerId) {
            throw new ApiError("You cannot change your own role", STATUS_CODES.FORBIDDEN);
        }

        const user = await prisma.user.findFirst({
            where: { id: targetId, isDeleted: false },
            include: { userRoleMappings: { include: { role: true } } },
        });

        if (!user) throw new ApiError("User not found", STATUS_CODES.NOT_FOUND);

        const targetHighestRole = getHighestRole(user.userRoleMappings);
        if (targetHighestRole === "SUPERADMIN") {
            throw new ApiError("SUPERADMIN role cannot be changed", STATUS_CODES.FORBIDDEN);
        }

        const roleRecord = await prisma.role.findUnique({ where: { name: data.role } });
        if (!roleRecord) throw new ApiError(`${data.role} role not found`, STATUS_CODES.SERVER_ERROR);

        await prisma.$transaction(async (tx) => {
            await tx.userRoleMapping.deleteMany({
                where: { userId: targetId, role: { name: { in: ["USER", "ADMIN"] } } },
            });

            await tx.userRoleMapping.create({
                data: { userId: targetId, roleId: roleRecord.id, assignedBy: callerId },
            });
        });

        return prisma.user.findUnique({ where: { id: targetId }, select: userSelectFields });
    }

    async deleteUser(targetId: string, callerRole: Role, callerId: string) {
        const user = await prisma.user.findFirst({
            where: { id: targetId, isDeleted: false },
            include: { userRoleMappings: { include: { role: true } } },
        });

        if (!user) throw new ApiError("User not found", STATUS_CODES.NOT_FOUND);

        const targetHighestRole = getHighestRole(user.userRoleMappings);

        if (targetHighestRole === "SUPERADMIN") {
            throw new ApiError("SUPERADMIN account cannot be deleted", STATUS_CODES.FORBIDDEN);
        }

        if (callerId !== targetId) {
            if (callerRole === "USER") {
                throw new ApiError("You can only delete your own account", STATUS_CODES.FORBIDDEN);
            }

            if ((ROLE_LEVEL[targetHighestRole] ?? 0) >= (ROLE_LEVEL[callerRole] ?? 0)) {
                throw new ApiError("You do not have permission to delete this user", STATUS_CODES.FORBIDDEN);
            }
        }

        await prisma.user.update({
            where: { id: targetId },
            data: { isDeleted: true, deletedAt: new Date() },
        });

        return { message: "User deleted successfully" };
    }
}

export default UserService;
