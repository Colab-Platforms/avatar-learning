import { Request, Response } from "express";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import UserService from "./user.service.js";
import { validateCreateUserSchema, validateUpdateUserSchema, validateSetUserRoleSchema } from "./user.validators.js";
import type { Role } from "./user.types.js";
import type { AuthRequest } from "@/middlewares/authMiddleware.js";
import { getResumeUploadSignature } from "@/utils/cloudinary.js";

const userService = new UserService();

export const getMe = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await userService.getUserById(req.user!.id, req.user!.role as Role, req.user!.id);
        sendResponse(res, true, result, "Profile fetched successfully", STATUS_CODES.OK);
    } catch (error: any) {
        sendResponse(res, false, null, error.message, error.statusCode ?? STATUS_CODES.SERVER_ERROR);
    }
};

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await userService.getAllUsers(
            req.query,
            req.user!.role as Role,
            req.user!.id,
        );
        sendResponse(res, true, result, "Users fetched successfully", STATUS_CODES.OK);
    } catch (error: any) {
        sendResponse(res, false, null, error.message, error.statusCode ?? STATUS_CODES.SERVER_ERROR);
    }
};


export const getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
        const targetId = req.params.id as string;
        if (!targetId) {
            sendResponse(res, false, null, "Invalid user ID", STATUS_CODES.BAD_REQUEST);
            return;
        }

        const result = await userService.getUserById(
            targetId,
            req.user!.role as Role,
            req.user!.id,
        );
        sendResponse(res, true, result, "User fetched successfully", STATUS_CODES.OK);
    } catch (error: any) {
        sendResponse(res, false, null, error.message, error.statusCode ?? STATUS_CODES.SERVER_ERROR);
    }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { error, value } = validateCreateUserSchema(req.body);
        if (error) {
            sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
            return;
        }

        const result = await userService.createUser(value);
        sendResponse(res, true, result, "User created successfully", STATUS_CODES.CREATED);
    } catch (error: any) {
        sendResponse(res, false, null, error.message, error.statusCode ?? STATUS_CODES.SERVER_ERROR);
    }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const targetId = req.params.id as string;
        if (!targetId) {
            sendResponse(res, false, null, "Invalid user ID", STATUS_CODES.BAD_REQUEST);
            return;
        }

        const { error, value } = validateUpdateUserSchema(req.body);
        if (error) {
            sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
            return;
        }

        const result = await userService.updateUser(
            targetId,
            value,
            req.user!.role as Role,
            req.user!.id,
        );
        sendResponse(res, true, result, "User updated successfully", STATUS_CODES.OK);
    } catch (error: any) {
        sendResponse(res, false, null, error.message, error.statusCode ?? STATUS_CODES.SERVER_ERROR);
    }
};

export const setUserRole = async (req: Request, res: Response): Promise<void> => {
    try {
        const targetId = req.params.id as string;
        if (!targetId) {
            sendResponse(res, false, null, "Invalid user ID", STATUS_CODES.BAD_REQUEST);
            return;
        }

        const { error, value } = validateSetUserRoleSchema(req.body);
        if (error) {
            sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
            return;
        }

        const result = await userService.setUserRole(
            targetId,
            value,
            req.user!.role as Role,
            req.user!.id,
        );
        sendResponse(res, true, result, "User role updated successfully", STATUS_CODES.OK);
    } catch (error: any) {
        sendResponse(res, false, null, error.message, error.statusCode ?? STATUS_CODES.SERVER_ERROR);
    }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const targetId = req.params.id as string;
        if (!targetId) {
            sendResponse(res, false, null, "Invalid user ID", STATUS_CODES.BAD_REQUEST);
            return;
        }

        const result = await userService.deleteUser(
            targetId,
            req.user!.role as Role,
            req.user!.id,
        );
        sendResponse(res, true, result, "User deleted successfully", STATUS_CODES.OK);
    } catch (error: any) {
        sendResponse(res, false, null, error.message, error.statusCode ?? STATUS_CODES.SERVER_ERROR);
    }
};

export const signResumeUpload = async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
        const signData = getResumeUploadSignature();
        sendResponse(res, true, signData, "Upload signature generated", STATUS_CODES.OK);
    } catch (error: any) {
        sendResponse(res, false, null, error.message, error.statusCode ?? STATUS_CODES.SERVER_ERROR);
    }
};

export const completeResumeUpload = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { publicId, secureUrl } = req.body as { publicId?: string; secureUrl?: string };
        if (!publicId || !secureUrl) {
            sendResponse(res, false, null, "publicId and secureUrl are required", STATUS_CODES.BAD_REQUEST);
            return;
        }
        const result = await userService.saveResume(req.user!.id, publicId, secureUrl);
        sendResponse(res, true, result, "Resume saved successfully", STATUS_CODES.OK);
    } catch (error: any) {
        sendResponse(res, false, null, error.message, error.statusCode ?? STATUS_CODES.SERVER_ERROR);
    }
};

export const deleteResume = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const result = await userService.deleteResume(req.user!.id);
        sendResponse(res, true, result, "Resume deleted successfully", STATUS_CODES.OK);
    } catch (error: any) {
        sendResponse(res, false, null, error.message, error.statusCode ?? STATUS_CODES.SERVER_ERROR);
    }
};

export const uploadProfileImage = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const result = await userService.uploadProfileImage(req.user!.id, req.file!);
        sendResponse(res, true, result, "Profile image uploaded successfully", STATUS_CODES.OK);
    } catch (error: any) {
        sendResponse(res, false, null, error.message, error.statusCode ?? STATUS_CODES.SERVER_ERROR);
    }
};

export const removeProfileImage = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const result = await userService.removeProfileImage(req.user!.id);
        sendResponse(res, true, result, "Profile image removed successfully", STATUS_CODES.OK);
    } catch (error: any) {
        sendResponse(res, false, null, error.message, error.statusCode ?? STATUS_CODES.SERVER_ERROR);
    }
};